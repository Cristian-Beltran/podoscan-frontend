import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Session } from "../session.interface";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
};

export function SessionChartsModal({ open, onOpenChange, session }: Props) {
  const records = session?.records ?? [];

  // ✅ colores fijos (consistentes)
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

  const formatT = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-ES", {
      minute: "2-digit",
      second: "2-digit",
    });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            Gráficos de la sesión{" "}
            <span className="font-mono text-xs text-muted-foreground">
              {session?.id ? session.id.slice(0, 8) : ""}
            </span>
          </DialogTitle>
          <DialogDescription>
            Visualización detallada por registro (SessionData)
          </DialogDescription>
        </DialogHeader>

        {!records.length ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Esta sesión no tiene registros.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Presión */}
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

            {/* Aceleración */}
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

            {/* Giroscopio */}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
