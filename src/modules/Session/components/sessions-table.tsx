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

// Tipos derivados del store (sin usar any)

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

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
      ? new Date(session.startedAt).toISOString()
      : "";
    const endedAt = session.endedAt
      ? new Date(session.endedAt).toISOString()
      : "";

    (session.records ?? []).forEach((record: SessionData) => {
      const rowValues: (string | number | boolean | null | undefined)[] = [
        session.id,
        patientName,
        deviceModel,
        deviceSerial,
        startedAt,
        endedAt,
        record.id,
        record.recordedAt ? new Date(record.recordedAt).toISOString() : "",
        record.p1,
        record.p2,
        record.p3,
        record.p4,
        record.p5,
        record.ax,
        record.ay,
        record.az,
        record.gx,
        record.gy,
        record.gz,
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
                      {formatDate(session.startedAt)}
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
                        {/* Header del detalle + botón CSV */}
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
                                  P1 (Talón, kg)
                                </TableHead>
                                <TableHead className="text-xs">
                                  P2 (Mediopié 1, kg)
                                </TableHead>
                                <TableHead className="text-xs">
                                  P3 (Mediopié 2, kg)
                                </TableHead>
                                <TableHead className="text-xs">
                                  P4 (Antepié 1, kg)
                                </TableHead>
                                <TableHead className="text-xs">
                                  P5 (Antepié 2, kg)
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
                                    {new Date(
                                      record.recordedAt,
                                    ).toLocaleTimeString("es-ES")}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.p1.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.p2.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.p3.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.p4.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.p5.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.ax.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.ay.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.az.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.gx.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.gy.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-[10px] md:text-xs">
                                    {record.gz.toFixed(2)}
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
