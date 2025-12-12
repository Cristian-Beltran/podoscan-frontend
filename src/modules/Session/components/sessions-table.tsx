import { useState } from "react";
import { sessionStore } from "@/modules/Session/data/session.store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Session, SessionData } from "../session.interface";

// Desplaza una fecha en horas (puede ser negativo)
const addHours = (date: string | Date, hours: number): Date => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return d;
  d.setHours(d.getHours() + hours);
  return d;
};

const formatDate = (date: string | Date) => {
  const d = addHours(date, -4); // -4h
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (date: string | Date) => {
  const d = addHours(date, -4); // -4h
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDateTimeCsv = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  const d = addHours(date, -4); // -4h
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// formatea números de records: si es número → máx 2 decimales, si no → vacío
const formatNumber2Decimals = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
};

// para CSV usamos lo mismo
const formatNumberCsv = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
};

const toCsvValue = (
  value: string | number | boolean | null | undefined,
): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function SessionsTable() {
  const { sessions, isLoading } = sessionStore();
  const [openSessions, setOpenSessions] = useState<Set<string>>(new Set());

  const toggleSession = (sessionId: string) => {
    setOpenSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const downloadSessionCsv = (session: Session) => {
    const headers = [
      "sessionId",
      "patientFullname",
      "deviceModel",
      "deviceSerial",
      "startedAt",
      "endedAt",
      "recordId",
      "recordedAt",
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
      "ax",
      "ay",
      "az",
      "gx",
      "gy",
      "gz",
    ];

    const rows: string[] = [];
    rows.push(headers.join(","));

    const patientName = session.patient?.user?.fullname ?? "";
    const deviceModel = session.device?.model ?? "";
    const deviceSerial = session.device?.serialNumber ?? "";
    const startedAt = session.startedAt
      ? formatDateTimeCsv(session.startedAt)
      : "";
    const endedAt = session.endedAt ? formatDateTimeCsv(session.endedAt) : "";

    (session.records ?? []).forEach((record: SessionData) => {
      const rowValues: (string | number | boolean | null | undefined)[] = [
        session.id,
        patientName,
        deviceModel,
        deviceSerial,
        startedAt,
        endedAt,
        record.id,
        record.recordedAt ? formatDateTimeCsv(record.recordedAt) : "",
        formatNumberCsv(record.p1),
        formatNumberCsv(record.p2),
        formatNumberCsv(record.p3),
        formatNumberCsv(record.p4),
        formatNumberCsv(record.p5),
        formatNumberCsv(record.ax),
        formatNumberCsv(record.ay),
        formatNumberCsv(record.az),
        formatNumberCsv(record.gx),
        formatNumberCsv(record.gy),
        formatNumberCsv(record.gz),
      ];

      const row = rowValues.map(toCsvValue).join(",");
      rows.push(row);
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `session-${String(session.id).slice(0, 8)}.csv`;

    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Sesión</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Dispositivo</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Fin</TableHead>
            <TableHead className="text-right">Registros</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-sm text-muted-foreground"
              >
                Cargando sesiones…
              </TableCell>
            </TableRow>
          )}

          {!isLoading && sessions.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-sm text-muted-foreground"
              >
                Sin sesiones para este paciente.
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            sessions.map((session) => (
              <Collapsible
                key={session.id}
                open={openSessions.has(session.id)}
                asChild
              >
                <>
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSession(session.id)}
                        >
                          {openSessions.has(session.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>

                    <TableCell className="font-mono text-xs md:text-sm">
                      {session.id.slice(0, 8)}…
                    </TableCell>

                    <TableCell className="text-sm">
                      {session.patient?.user?.fullname ?? "—"}
                    </TableCell>

                    <TableCell className="text-sm">
                      <Badge variant="outline">
                        {session.device?.model ?? "—"}{" "}
                        {session.device?.serialNumber
                          ? `(${session.device.serialNumber})`
                          : ""}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs md:text-sm">
                      {session.startedAt ? formatDate(session.startedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {session.endedAt ? formatDate(session.endedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge>{session.records?.length ?? 0}</Badge>
                    </TableCell>
                  </TableRow>

                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50 p-0">
                        <div className="flex items-center justify-between gap-2 p-4 pb-2">
                          <span className="text-xs text-muted-foreground">
                            Registros de la sesión
                          </span>
                          <Button
                            variant="outline"
                            onClick={() => downloadSessionCsv(session)}
                            disabled={
                              !session.records || session.records.length === 0
                            }
                          >
                            <Download className="mr-1 h-3 w-3" />
                            CSV
                          </Button>
                        </div>

                        <div className="overflow-x-auto p-4 pt-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">
                                  Tiempo
                                </TableHead>

                                <TableHead className="text-xs">
                                  P1 (Talón, N)
                                </TableHead>
                                <TableHead className="text-xs">
                                  P2 (Mediopié 1, N)
                                </TableHead>
                                <TableHead className="text-xs">
                                  P3 (Mediopié 2, N)
                                </TableHead>
                                <TableHead className="text-xs">
                                  P4 (Antepié 1, N)
                                </TableHead>
                                <TableHead className="text-xs">
                                  P5 (Antepié 2, N)
                                </TableHead>

                                <TableHead className="text-xs">AX</TableHead>
                                <TableHead className="text-xs">AY</TableHead>
                                <TableHead className="text-xs">AZ</TableHead>
                                <TableHead className="text-xs">GX</TableHead>
                                <TableHead className="text-xs">GY</TableHead>
                                <TableHead className="text-xs">GZ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {session.records?.map((record: SessionData) => (
                                <TableRow key={record.id}>
                                  <TableCell className="font-mono text-[10px] md:text-xs">
                                    {record.recordedAt
                                      ? formatTime(record.recordedAt)
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.p1)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.p2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.p3)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.p4)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.p5)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.ax)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.ay)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.az)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.gx)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.gy)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {formatNumber2Decimals(record.gz)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
