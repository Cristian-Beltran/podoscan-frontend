import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Session, SessionData } from "../session.interface";
import { sendStream } from "@/lib/mqtt";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

function sameLocalDay(aIso: string, b: Date) {
  const a = new Date(aIso);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const formatT = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", {
    minute: "2-digit",
    second: "2-digit",
  });

const n2 = (v: unknown) => {
  const num = Number(v);
  return Number.isFinite(num) ? num.toFixed(2) : "—";
};

type Props = {
  sessions: Session[];
  onReload?: () => Promise<void> | void;
};

export function SessionTodayLive({ sessions, onReload }: Props) {
  const [streamOn, setStreamOn] = useState(false);

  const toggleStream = async () => {
    const next = !streamOn;
    setStreamOn(next);
    sendStream(next);

    if (next) {
      try {
        await onReload?.();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const todaySession = useMemo(() => {
    const now = new Date();
    const todays = sessions
      .filter((s) => s.startedAt && sameLocalDay(s.startedAt, now))
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );
    return todays[0] ?? null;
  }, [sessions]);

  const records = todaySession?.records ?? [];

  const COLORS = {
    heel: "#ef4444",
    mid: "#22c55e",
    fore: "#3b82f6",
    ax: "#ef4444",
    ay: "#22c55e",
    az: "#3b82f6",
    gx: "#a855f7",
    gy: "#f59e0b",
    gz: "#06b6d4",
  } as const;

  const pressureData = useMemo(
    () =>
      records.slice(-600).map((r) => ({
        t: formatT(r.recordedAt),
        heel: r.p1,
        mid: (r.p2 + r.p3) / 2,
        fore: (r.p4 + r.p5) / 2,
      })),
    [records],
  );

  const accelData = useMemo(
    () =>
      records.slice(-600).map((r) => ({
        t: formatT(r.recordedAt),
        ax: r.ax,
        ay: r.ay,
        az: r.az,
      })),
    [records],
  );

  const gyroData = useMemo(
    () =>
      records.slice(-600).map((r) => ({
        t: formatT(r.recordedAt),
        gx: r.gx,
        gy: r.gy,
        gz: r.gz,
      })),
    [records],
  );

  const rawRows = useMemo(() => records.slice(-200), [records]);

  return (
    <div className="space-y-4">
      {/* ✅ Header SIEMPRE, con botón SIEMPRE */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                Sesión de hoy (Tiempo real)
                <span className="font-mono text-xs text-muted-foreground">
                  {todaySession?.id ? todaySession.id.slice(0, 8) : "—"}
                </span>
              </CardTitle>
              <CardDescription>
                {todaySession
                  ? `Vista en tiempo real • registros: ${records.length}`
                  : "Aún no hay sesión hoy. Puedes iniciarla desde aquí."}
              </CardDescription>
            </div>

            <Button
              variant={streamOn ? "destructive" : "default"}
              onClick={toggleStream}
            >
              {streamOn ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Detener envío
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar envío
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ✅ Si no hay sesión hoy, mostramos estado y listo (sin romper UI) */}
      {!todaySession ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin sesión hoy</CardTitle>
            <CardDescription>
              Inicia el envío para que el dispositivo cree la sesión y empiece a
              transmitir datos. Esta vista se actualizará automáticamente.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Presión (heel/mid/fore)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pressureData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" hide />
                      <YAxis />
                      <Tooltip
                        formatter={(v: number) => Number(v).toFixed(2)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="heel"
                        stroke={COLORS.heel}
                        strokeWidth={2}
                        dot={false}
                        name="Retropié"
                      />
                      <Line
                        type="monotone"
                        dataKey="mid"
                        stroke={COLORS.mid}
                        strokeWidth={2}
                        dot={false}
                        name="Mediopié"
                      />
                      <Line
                        type="monotone"
                        dataKey="fore"
                        stroke={COLORS.fore}
                        strokeWidth={2}
                        dot={false}
                        name="Antepié"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Aceleración (ax/ay/az)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" hide />
                      <YAxis />
                      <Tooltip
                        formatter={(v: number) => Number(v).toFixed(3)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ax"
                        stroke={COLORS.ax}
                        strokeWidth={2}
                        dot={false}
                        name="AX"
                      />
                      <Line
                        type="monotone"
                        dataKey="ay"
                        stroke={COLORS.ay}
                        strokeWidth={2}
                        dot={false}
                        name="AY"
                      />
                      <Line
                        type="monotone"
                        dataKey="az"
                        stroke={COLORS.az}
                        strokeWidth={2}
                        dot={false}
                        name="AZ"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Giroscopio (gx/gy/gz)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gyroData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" hide />
                      <YAxis />
                      <Tooltip
                        formatter={(v: number) => Number(v).toFixed(3)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="gx"
                        stroke={COLORS.gx}
                        strokeWidth={2}
                        dot={false}
                        name="GX"
                      />
                      <Line
                        type="monotone"
                        dataKey="gy"
                        stroke={COLORS.gy}
                        strokeWidth={2}
                        dot={false}
                        name="GY"
                      />
                      <Line
                        type="monotone"
                        dataKey="gz"
                        stroke={COLORS.gz}
                        strokeWidth={2}
                        dot={false}
                        name="GZ"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Datos crudos (últimos {rawRows.length})</CardTitle>
              <CardDescription>
                Se agrega información a medida que llegan registros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Tiempo</TableHead>
                      <TableHead className="text-xs">P1</TableHead>
                      <TableHead className="text-xs">P2</TableHead>
                      <TableHead className="text-xs">P3</TableHead>
                      <TableHead className="text-xs">P4</TableHead>
                      <TableHead className="text-xs">P5</TableHead>
                      <TableHead className="text-xs">AX</TableHead>
                      <TableHead className="text-xs">AY</TableHead>
                      <TableHead className="text-xs">AZ</TableHead>
                      <TableHead className="text-xs">GX</TableHead>
                      <TableHead className="text-xs">GY</TableHead>
                      <TableHead className="text-xs">GZ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawRows.map((r: SessionData) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-[10px] md:text-xs">
                          {r.recordedAt ? formatT(r.recordedAt) : "—"}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.p1)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.p2)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.p3)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.p4)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.p5)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.ax)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.ay)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.az)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.gx)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.gy)}
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {n2(r.gz)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
