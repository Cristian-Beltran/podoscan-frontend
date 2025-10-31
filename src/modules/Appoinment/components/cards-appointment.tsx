import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Footprints } from "lucide-react";
import type { Appointment } from "../appointment.interface";
import { appointmentService } from "../data/appointment.service";

export function PlantarPhotosGallery({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {appointments.map((appointment) => (
        <Card
          key={appointment.id}
          className="overflow-hidden transition-shadow hover:shadow-lg"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Footprints className="h-5 w-5 text-primary" />
                Evaluación
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {Number(appointment.contactTotalPct ?? 0).toFixed(0)}%
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {appointment.appointmentAt
                ? formatDate(appointment.appointmentAt)
                : "—"}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Imagen de la base plantar */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={appointment.processedUrl || appointment.originalUrl || ""}
                alt="Base plantar"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Datos de distribución de presión */}
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

            {/* Notas */}
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
