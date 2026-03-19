import { useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const patientName = session?.patient?.user?.fullname ?? "Paciente sin nombre";

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

  const handleDownloadPdf = () => {
    if (!contentRef.current) return;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sesion ${patientName}</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, sans-serif;
              background: white;
              color: black;
            }
            .print-root {
              max-width: 1200px;
              margin: 0 auto;
            }
            svg {
              overflow: visible;
            }
            .pdf-action {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-root">${contentRef.current.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-5xl">
        <div ref={contentRef}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="flex items-center justify-between gap-2">
                  Gráficos de la sesión{" "}
                  <span className="text-xs text-muted-foreground">
                    {patientName}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Visualización detallada por registro (SessionData)
                </DialogDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPdf}
                className="pdf-action"
              >
                Descargar PDF
              </Button>
            </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
