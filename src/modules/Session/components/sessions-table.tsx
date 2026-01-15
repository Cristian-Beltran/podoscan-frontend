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
import { ChevronDown, ChevronRight, Download, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Session, SessionData } from "../session.interface";
import { SessionChartsModal } from "./session-charts-modal"; // ✅ importa el modal

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

  // ✅ modal charts por sesión
  const [chartsOpen, setChartsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const toggleSession = (sessionId: string) => {
    setOpenSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const openCharts = (session: Session) => {
    setSelectedSession(session);
    setChartsOpen(true);
  };

  const downloadSessionCsv = (session: Session) => {
    // ... (tu implementación actual)
  };

  return (
    <>
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
              <TableHead className="w-[120px]" /> {/* ✅ acciones */}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-sm text-muted-foreground"
                >
                  Cargando sesiones…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && sessions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
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
                        {session.startedAt
                          ? formatDate(session.startedAt)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {session.endedAt ? formatDate(session.endedAt) : "—"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge>{session.records?.length ?? 0}</Badge>
                      </TableCell>

                      {/* ✅ acciones */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCharts(session)}
                            disabled={
                              !session.records || session.records.length === 0
                            }
                          >
                            <LineChart className="mr-1 h-3.5 w-3.5" />
                            Charts
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/50 p-0">
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

                          {/* ... tu tabla de records igual, sin cambios ... */}
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ modal charts */}
      <SessionChartsModal
        open={chartsOpen}
        onOpenChange={setChartsOpen}
        session={selectedSession}
      />
    </>
  );
}
