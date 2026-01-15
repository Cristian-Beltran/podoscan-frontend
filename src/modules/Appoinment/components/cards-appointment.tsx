import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Footprints, X } from "lucide-react";
import type { Appointment } from "../appointment.interface";
import { appointmentService } from "../data/appointment.service";
import { Button } from "@/components/ui/button";

export function PlantarPhotosGallery({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ selección por click (máx 2)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const compareMode = selectedIds.length === 2;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await appointmentService.listByPatient(patientId);
        if (mounted) setAppointments(data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  // si cambia paciente, resetea selección
  useEffect(() => {
    setSelectedIds([]);
  }, [patientId]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getChippauxBadge = (appt: Appointment) => {
    const idx = appt.chippauxSmirakIndex;
    const hasIndex =
      idx !== null && idx !== undefined && !Number.isNaN(Number(idx));

    if (!hasIndex) {
      return (
        <Badge variant="outline" className="text-xs">
          {Number(appt.contactTotalPct ?? 0).toFixed(0)}% contacto
        </Badge>
      );
    }

    const value = Number(idx);
    let variant: "default" | "outline" | "secondary" = "outline";
    const label = `${value.toFixed(0)}% Chippaux`;

    if (value < 25) variant = "secondary";
    else if (value < 45) variant = "default";
    else variant = "default";

    return (
      <Badge variant={variant} className="text-xs">
        {label}
      </Badge>
    );
  };

  const togglePick = (id: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);

      // si ya estaba seleccionada, la quita
      if (exists) return prev.filter((x) => x !== id);

      // si hay 0 o 1, agrega
      if (prev.length < 2) return [...prev, id];

      // si ya hay 2, reemplaza la más antigua (la primera)
      return [prev[1], id];
    });
  };

  const clearFilter = () => setSelectedIds([]);

  const visibleAppointments = useMemo(() => {
    if (!compareMode) return appointments;

    // mantener el orden de selección (A luego B)
    const map = new Map(appointments.map((a) => [String(a.id), a]));
    return selectedIds
      .map((id) => map.get(id))
      .filter(Boolean) as Appointment[];
  }, [compareMode, appointments, selectedIds]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Cargando citas…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sin citas registradas</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ barra simple: instrucción + botón de quitar filtro SOLO cuando hay 2 */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {!compareMode ? (
            <span>
              Selecciona <b>2</b> evaluaciones para comparar{" "}
              <span className="ml-2 font-mono text-xs">
                ({selectedIds.length}/2)
              </span>
            </span>
          ) : (
            <span>
              Comparando 2 evaluaciones{" "}
              <span className="ml-2 font-mono text-xs">(2/2)</span>
            </span>
          )}
        </div>

        {compareMode && (
          <Button variant="outline" size="sm" onClick={clearFilter}>
            <X className="mr-1 h-4 w-4" />
            Limpiar comparación
          </Button>
        )}
      </div>

      {/* ✅ Grilla: normal vs comparación (centrada) */}
      <div
        className={
          compareMode
            ? "mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2"
            : "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        }
      >
        {visibleAppointments.map((appointment) => {
          const isSelected = selectedIds.includes(String(appointment.id));

          return (
            <Card
              key={appointment.id}
              onClick={() => togglePick(String(appointment.id))}
              role="button"
              tabIndex={0}
              className={[
                "cursor-pointer overflow-hidden transition-shadow hover:shadow-lg",
                isSelected ? "ring-2 ring-primary" : "",
              ].join(" ")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Footprints className="h-5 w-5 text-primary" />
                    Evaluación
                  </CardTitle>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Badge className="text-xs" variant="default">
                        Seleccionada
                      </Badge>
                    )}
                    {getChippauxBadge(appointment)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {appointment.appointmentAt
                    ? formatDate(appointment.appointmentAt)
                    : "—"}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
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
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-blue-50 p-2 text-center dark:bg-blue-950">
                    <div className="mb-1 text-xs text-muted-foreground">
                      Antepié
                    </div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {Number(appointment.forefootPct ?? 0).toFixed(0)}%
                    </div>
                  </div>
                  <div className="rounded-md bg-green-50 p-2 text-center dark:bg-green-950">
                    <div className="mb-1 text-xs text-muted-foreground">
                      Mediopié
                    </div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {Number(appointment.midfootPct ?? 0).toFixed(0)}%
                    </div>
                  </div>
                  <div className="rounded-md bg-orange-50 p-2 text-center dark:bg-orange-950">
                    <div className="mb-1 text-xs text-muted-foreground">
                      Retropié
                    </div>
                    <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {Number(appointment.rearfootPct ?? 0).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-muted/60 p-2">
                    <div className="text-muted-foreground">Antepié (cm)</div>
                    <div className="mt-1 font-semibold">
                      {appointment.forefootWidthMm != null
                        ? appointment.forefootWidthMm.toFixed(1)
                        : "—"}
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/60 p-2">
                    <div className="text-muted-foreground">Istmo (cm)</div>
                    <div className="mt-1 font-semibold">
                      {appointment.isthmusWidthMm != null
                        ? appointment.isthmusWidthMm.toFixed(1)
                        : "—"}
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/60 p-2">
                    <div className="text-muted-foreground">Chippaux (%)</div>
                    <div className="mt-1 font-semibold">
                      {appointment.chippauxSmirakIndex != null
                        ? appointment.chippauxSmirakIndex.toFixed(1)
                        : "—"}
                    </div>
                  </div>
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
          );
        })}
      </div>
    </div>
  );
}
