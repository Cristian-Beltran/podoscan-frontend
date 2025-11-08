import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Cpu, ClipboardList } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { patientService } from "@/modules/Patient/data/patient.service";
import { deviceService } from "@/modules/Device/data/device.service";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { Appointment } from "../Appoinment/appointment.interface";
import { appointmentService } from "../Appoinment/data/appointment.service";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/auth/useAuth";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [patientsCount, setPatientsCount] = useState(0);
  const [devicesCount, setDevicesCount] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const redirectTo =
    user?.type === "patient"
      ? "/me"
      : user?.type === "family"
        ? "/family/patients"
        : null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [patients, devices, appts] = await Promise.all([
          patientService.findAll(),
          deviceService.findAll(),
          appointmentService.findAll(),
        ]);
        if (!mounted) return;
        setPatientsCount(patients.length || 0);
        setDevicesCount(devices.length || 0);
        setAppointments(appts ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const kpis = useMemo(() => {
    const total = appointments.length;
    const today = appointments.filter((a) =>
      (a.appointmentAt ?? "").startsWith(todayStr),
    ).length;
    return { total, today };
  }, [appointments, todayStr]);

  // Serie últimos 7 días
  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        label: d.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        }),
      };
    });
    const counts = days.map(({ key, label }) => ({
      day: label,
      count: appointments.filter((a) => (a.appointmentAt ?? "").startsWith(key))
        .length,
    }));
    return counts;
  }, [appointments]);

  const recent = useMemo(
    () =>
      [...appointments]
        .sort((a, b) =>
          (b.appointmentAt ?? "").localeCompare(a.appointmentAt ?? ""),
        )
        .slice(0, 10),
    [appointments],
  );

  const formatDateTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("es-ES", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const chartConfig = {
    count: { label: "Citas", color: "hsl(var(--primary))" },
  };

  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Badge variant="outline">
          Hoy: {new Date().toLocaleDateString("es-ES")}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : patientsCount}
            </div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : devicesCount}
            </div>
            <p className="text-xs text-muted-foreground">Inventario activo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Citas hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : kpis.today}
            </div>
            <p className="text-xs text-muted-foreground">Agendadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Citas totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : kpis.total}
            </div>
            <p className="text-xs text-muted-foreground">Histórico</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Gráfico últimas 7 días */}
      <Card>
        <CardHeader>
          <CardTitle>Citas últimos 7 días</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Citas"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Últimas 10 citas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas 10 citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead className="text-right">Contacto total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground"
                    >
                      Cargando…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && recent.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground"
                    >
                      Sin registros
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  recent.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(a.appointmentAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.patient?.user?.fullname ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.doctor?.user?.fullname ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {Number(a.contactTotalPct ?? 0).toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
