import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Footprints,
  ActivitySquareIcon as Activity,
  Gauge,
  Info,
} from "lucide-react";
import { sessionService } from "@/modules/Session/data/session.service";
import type { Session, SessionData } from "@/modules/Session/session.interface";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/auth/useAuth";
import { appointmentService } from "../Appoinment/data/appointment.service";
import type { Appointment } from "../Appoinment/appointment.interface";

export default function MePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [patientId, setPatientId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setPatientId(id || user?.id || "");
      if (!patientId) return;
      setLoading(true);
      setError(null);
      try {
        const [s, a] = await Promise.all([
          sessionService.listByPatient(patientId),
          appointmentService.listByPatient(patientId),
        ]);
        if (!mounted) return;
        setSessions(s ?? []);
        setAppointments(a ?? []);
      } catch {
        if (mounted)
          setError("No pudimos cargar la información. Intenta nuevamente.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientId]);
  const allRecords: SessionData[] = useMemo(
    () => sessions.flatMap((s) => s.records || []),
    [sessions],
  );

  if (!patientId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paciente no identificado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Proporcione <code>?patientId=</code> en la URL o pase{" "}
            <code>patientId</code> por props.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-40 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-28 w-full rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const kpis = computeKPIs(allRecords, appointments);

  return (
    <div className="space-y-6">
      <HeaderKpis kpis={kpis} />

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList>
          <TabsTrigger value="sessions" className="gap-2">
            <Activity className="h-4 w-4" /> Sesiones
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" /> Citas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <PressureOverviewPanel records={allRecords} />
          <ImuOverviewPanel records={allRecords} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsGallerySimple appointments={appointments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** ===================== Helpers & Types ===================== */
function computeKPIs(records: SessionData[], appointments: Appointment[]) {
  const sessionsCount = records.length
    ? new Set(records.map((r) => r.id.split(":")[0] || "s")).size
    : 0;
  const lastRecordAt = records.length
    ? records[records.length - 1].recordedAt
    : undefined;

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const p1 = avg(records.map((r) => r.p1));
  const p2 = avg(records.map((r) => r.p2));
  const p3 = avg(records.map((r) => r.p3));
  const p4 = avg(records.map((r) => r.p4));
  const p5 = avg(records.map((r) => r.p5));

  const totals = { heel: p1, mid: p2 + p3, fore: p4 + p5 };
  const totalSum = totals.heel + totals.mid + totals.fore || 1;
  const distribution = {
    heelPct: Math.round((totals.heel / totalSum) * 100),
    midPct: Math.round((totals.mid / totalSum) * 100),
    forePct: Math.round((totals.fore / totalSum) * 100),
  };

  const apptCount = appointments.length;
  const lastAppt = appointments[0]?.appointmentAt
    ? [...appointments].sort(
        (a, b) => +new Date(b.appointmentAt) - +new Date(a.appointmentAt),
      )[0]
    : undefined;

  return {
    sessionsCount,
    lastRecordAt,
    distribution,
    apptCount,
    lastApptAt: lastAppt?.appointmentAt,
  } as const;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** ===================== UI: KPIs Header ===================== */
function HeaderKpis({
  kpis,
}: {
  kpis: {
    sessionsCount: number;
    lastRecordAt?: string;
    distribution: { heelPct: number; midPct: number; forePct: number };
    apptCount: number;
    lastApptAt?: string;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Activity className="h-4 w-4" /> Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold">{kpis.sessionsCount}</span>
            <Badge variant="outline" className="text-xs">
              Último: {formatDate(kpis.lastRecordAt)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Gauge className="h-4 w-4" /> Distribución promedio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniKpi
              label="Retropié"
              value={kpis.distribution.heelPct}
              suffix="%"
            />
            <MiniKpi
              label="Mediopié"
              value={kpis.distribution.midPct}
              suffix="%"
            />
            <MiniKpi
              label="Antepié"
              value={kpis.distribution.forePct}
              suffix="%"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Calendar className="h-4 w-4" /> Citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold">{kpis.apptCount}</span>
            <Badge variant="outline" className="text-xs">
              Última: {formatDate(kpis.lastApptAt)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Info className="h-4 w-4" /> Nota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Estos datos resumen cómo apoya su pie: atrás (talón), medio y
            adelante. Buscamos equilibrio y comodidad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniKpi({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">
        {Number(value || 0).toFixed(0)}
        {suffix}
      </div>
    </div>
  );
}

/** ===================== UI: Sesiones ===================== */
function PressureOverviewPanel({ records }: { records: SessionData[] }) {
  const lineData = useMemo(
    () =>
      records.slice(-300).map((r) => ({
        t: new Date(r.recordedAt).toLocaleTimeString("es-ES", {
          minute: "2-digit",
          second: "2-digit",
        }),
        heel: r.p1,
        mid: (r.p2 + r.p3) / 2,
        fore: (r.p4 + r.p5) / 2,
      })),
    [records],
  );

  const pieAgg = useMemo(() => {
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const heel = sum(records.map((r) => r.p1));
    const mid = sum(records.map((r) => r.p2 + r.p3));
    const fore = sum(records.map((r) => r.p4 + r.p5));
    const total = heel + mid + fore || 1;
    return [
      { name: "Retropié", value: Math.round((heel / total) * 100) },
      { name: "Mediopié", value: Math.round((mid / total) * 100) },
      { name: "Antepié", value: Math.round((fore / total) * 100) },
    ];
  }, [records]);

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <Card className="md:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Presión a lo largo del tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" hide />
                  <YAxis />
                  <Tooltip formatter={(v: number) => v.toFixed(0)} />
                  <Line
                    type="monotone"
                    dataKey="heel"
                    strokeWidth={2}
                    dot={false}
                    name="Retropié"
                  />
                  <Line
                    type="monotone"
                    dataKey="mid"
                    strokeWidth={2}
                    dot={false}
                    name="Mediopié"
                  />
                  <Line
                    type="monotone"
                    dataKey="fore"
                    strokeWidth={2}
                    dot={false}
                    name="Antepié"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState caption="Aún no hay registros de presión" />
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribución promedio</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieAgg}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {pieAgg.map((_, idx) => (
                      <Cell key={idx} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <Separator className="my-3" />
              <div className="grid grid-cols-3 gap-2 text-center">
                {pieAgg.map((s) => (
                  <div key={s.name} className="rounded border p-2">
                    <div className="text-xs text-muted-foreground">
                      {s.name}
                    </div>
                    <div className="text-xl font-semibold">{s.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState caption="Sin datos para el promedio" />
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Mapa rápido de zonas (último registro)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length ? (
            <PressureBars record={records[records.length - 1]} />
          ) : (
            <EmptyState caption="Registra una sesión para ver tus zonas de apoyo" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ImuOverviewPanel({ records }: { records: SessionData[] }) {
  const data = useMemo(
    () =>
      records.slice(-300).map((r) => ({
        t: new Date(r.recordedAt).toLocaleTimeString("es-ES", {
          minute: "2-digit",
          second: "2-digit",
        }),
        ax: r.ax,
        ay: r.ay,
        az: r.az,
        gx: r.gx,
        gy: r.gy,
        gz: r.gz,
      })),
    [records],
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aceleración (g)</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" hide />
                  <YAxis />
                  <Tooltip formatter={(v: number) => v.toFixed(2)} />
                  <Line
                    type="monotone"
                    dataKey="ax"
                    strokeWidth={2}
                    dot={false}
                    name="X"
                  />
                  <Line
                    type="monotone"
                    dataKey="ay"
                    strokeWidth={2}
                    dot={false}
                    name="Y"
                  />
                  <Line
                    type="monotone"
                    dataKey="az"
                    strokeWidth={2}
                    dot={false}
                    name="Z"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState caption="Sin datos de aceleración" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Giroscopio (°/s)</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" hide />
                  <YAxis />
                  <Tooltip formatter={(v: number) => v.toFixed(2)} />
                  <Line
                    type="monotone"
                    dataKey="gx"
                    strokeWidth={2}
                    dot={false}
                    name="X"
                  />
                  <Line
                    type="monotone"
                    dataKey="gy"
                    strokeWidth={2}
                    dot={false}
                    name="Y"
                  />
                  <Line
                    type="monotone"
                    dataKey="gz"
                    strokeWidth={2}
                    dot={false}
                    name="Z"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState caption="Sin datos de giro" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PressureBars({ record }: { record: SessionData }) {
  const items = [
    { key: "p1", label: "Talón Kg", value: record.p1 },
    { key: "p2", label: "Mediopié 1 Kg", value: record.p2 },
    { key: "p3", label: "Mediopié 2 Kg", value: record.p3 },
    { key: "p4", label: "Antepié 1 Kg", value: record.p4 },
    { key: "p5", label: "Antepié 2 Kg", value: record.p5 },
  ];
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((i) => (
        <div key={i.key} className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{i.label}</span>
            <span>{i.value.toFixed(0)}</span>
          </div>
          <div className="h-2 w-full rounded bg-muted">
            <div
              className="h-2 rounded bg-primary"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ caption }: { caption: string }) {
  return (
    <div className="text-center text-sm text-muted-foreground">{caption}</div>
  );
}

/** ===================== UI: Citas ===================== */
function AppointmentsGallerySimple({
  appointments,
}: {
  appointments: Appointment[];
}) {
  if (!appointments?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin citas registradas</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const toPct = (n?: number | null) => Number(n ?? 0).toFixed(0) + "%";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {appointments.map((appointment) => (
        <Card
          key={appointment.id}
          className="overflow-hidden transition-shadow hover:shadow-lg"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Footprints className="h-5 w-5 text-primary" /> Evaluación
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {toPct(appointment.contactTotalPct)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />{" "}
              {appointment.appointmentAt
                ? formatDate(appointment.appointmentAt)
                : "—"}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {appointment.processedUrl || appointment.originalUrl ? (
                <img
                  src={
                    appointment.processedUrl || appointment.originalUrl || ""
                  }
                  alt="Base plantar"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <KpiPill
                label="Antepié"
                value={toPct(appointment.forefootPct)}
                variant="fore"
              />
              <KpiPill
                label="Mediopié"
                value={toPct(appointment.midfootPct)}
                variant="mid"
              />
              <KpiPill
                label="Retropié"
                value={toPct(appointment.rearfootPct)}
                variant="heel"
              />
            </div>

            {appointment.note && (
              <div className="border-t pt-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {appointment.note}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function KpiPill({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "fore" | "mid" | "heel";
}) {
  const bg =
    variant === "fore"
      ? "bg-orange-50 dark:bg-orange-950"
      : variant === "mid"
        ? "bg-green-50 dark:bg-green-950"
        : "bg-blue-50 dark:bg-blue-950";
  const text =
    variant === "fore"
      ? "text-orange-600 dark:text-orange-400"
      : variant === "mid"
        ? "text-green-600 dark:text-green-400"
        : "text-blue-600 dark:text-blue-400";
  return (
    <div className={`rounded-md ${bg} p-2 text-center`}>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${text}`}>{value}</div>
    </div>
  );
}
