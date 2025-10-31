import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Save,
  LogOut,
  Footprints,
  Lightbulb,
  MoveLeft,
  MoveRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAppointmentStore } from "./data/appointment.store";
import type { Appointment } from "./appointment.interface";
import { useNavigate, useParams } from "react-router-dom";
import FootPreviewModal from "./components/foot-model";

// ✅ importa cliente MQTT correcto (usa mqtt/dist/mqtt.min.js dentro)
import { getMqtt, sendLed, sendServo } from "@/lib/mqtt";

export default function AppointmentViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [open, setOpen] = useState(false);
  const {
    findOne,
    editPatientData,
    uploadPhoto,
    data, // caché local
    isLoading,
  } = useAppointmentStore();

  const appt: Appointment | undefined = useMemo(
    () => data.find((a) => a.id === id),
    [data, id],
  );

  // estado local editable (nota + métricas)
  const [note, setNote] = useState<string>("");
  const [contactTotalPct, setContactTotalPct] = useState<number | "">("");
  const [forefootPct, setForefootPct] = useState<number | "">("");
  const [midfootPct, setMidfootPct] = useState<number | "">("");
  const [rearfootPct, setRearfootPct] = useState<number | "">("");

  // imágenes
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  // ✅ Estado LED UI
  const [ledOn, setLedOn] = useState(false);

  // Cargar cita (si no está en caché) y poblar estado local
  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        await findOne(id);
      } catch {
        toast.error("No se pudo cargar la cita");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!appt) return;
    setNote(appt.note ?? "");
    setContactTotalPct(appt.contactTotalPct ?? 0);
    setForefootPct(appt.forefootPct ?? 0);
    setMidfootPct(appt.midfootPct ?? 0);
    setRearfootPct(appt.rearfootPct ?? 0);
    setOriginalUrl(appt.originalUrl ?? null);
    setProcessedUrl(appt.processedUrl ?? null);
  }, [appt]);

  const patientName = appt?.patient?.user?.fullname ?? "—";
  const doctorName = appt?.doctor?.user?.fullname ?? "—";

  // ✅ Conexión MQTT al montar
  useEffect(() => {
    getMqtt();
  }, []);

  // Subir foto real al backend
  const handleFootImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      setIsProcessing(true);
      const updated = await uploadPhoto(id, file);
      setOriginalUrl(updated.originalUrl ?? null);
      setProcessedUrl(updated.processedUrl ?? null);
      toast.success("Imagen subida");
    } catch {
      toast.error("No se pudo subir la imagen");
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  // Guardar cambios (nota + métricas)
  const persist = async () => {
    if (!id) return;
    try {
      await editPatientData(id, {
        note,
        contactTotalPct: Number(contactTotalPct || 0),
        forefootPct: Number(forefootPct || 0),
        midfootPct: Number(midfootPct || 0),
        rearfootPct: Number(rearfootPct || 0),
      });
      toast.success("Datos clínicos guardados");
    } catch {
      toast.error("No se pudieron guardar los datos");
    }
  };

  const handleSave = async () => {
    await persist();
  };

  const handleSaveAndExit = async () => {
    await persist();
    navigate("/appointment");
  };

  // ✅ Handlers MQTT
  const toggleLed = () => {
    const newState = !ledOn;
    setLedOn(newState);
    sendLed(newState);
  };

  const moveServo = (dir: "adelante" | "atras") => {
    sendServo(dir);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <Card className="print:shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              {isLoading
                ? "Cargando cita…"
                : "Cita — Análisis de Presión Plantar"}
            </CardTitle>

            {/* ✅ Controles MQTT en esta página */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant={ledOn ? "default" : "outline"}
                onClick={toggleLed}
                title="Encender/Apagar LED del ESP"
                className="h-8"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                {ledOn ? "LED ON" : "LED OFF"}
              </Button>

              <Button
                variant="outline"
                onClick={() => moveServo("atras")}
                title="Mover servo hacia atrás"
                className="h-8"
              >
                <MoveLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>

              <Button
                variant="outline"
                onClick={() => moveServo("adelante")}
                title="Mover servo hacia adelante"
                className="h-8"
              >
                Adelante
                <MoveRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Encabezado paciente */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Paciente</Label>
                <p className="text-lg font-medium">{patientName}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Doctor</Label>
                <p className="text-lg font-medium">{doctorName}</p>
              </div>
            </div>

            {/* Sección de Imágenes */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Imagen de Pies (Original)</Label>
                <div className="flex flex-col gap-2">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50">
                    {originalUrl ? (
                      <img
                        src={originalUrl}
                        alt="Imagen original"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Upload className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full print:hidden bg-transparent"
                    onClick={() =>
                      document.getElementById("foot-upload")?.click()
                    }
                    disabled={isProcessing || !id}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Imagen
                  </Button>
                  <input
                    id="foot-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFootImageUpload}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resultado (Procesada)</Label>
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-border bg-muted/50">
                  {isProcessing ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <div className="relative h-16 w-16">
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <div className="absolute inset-2 animate-pulse rounded-full bg-primary/20" />
                      </div>
                      <p className="animate-pulse text-sm font-medium text-primary">
                        Procesando imagen...
                      </p>
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      </div>
                    </div>
                  ) : processedUrl ? (
                    <img
                      src={processedUrl}
                      alt="Imagen procesada"
                      className="h-full w-full object-cover animate-in fade-in duration-500"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <p className="text-sm">Resultado aparecerá aquí</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full print:hidden bg-transparent"
                  onClick={() => setOpen(true)}
                  disabled={isProcessing || !id}
                >
                  <Footprints className="mr-2 h-4 w-4" />
                  Ver pie 3D
                </Button>
              </div>
            </div>

            {/* Métricas */}
            <div className="space-y-2">
              <Label>Métricas (porcentaje)</Label>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="contactTotalPct"
                    className="text-sm text-muted-foreground"
                  >
                    Contacto total
                  </Label>
                  <Input
                    id="contactTotalPct"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={contactTotalPct}
                    onChange={(e) =>
                      setContactTotalPct(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="print:border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="forefootPct"
                    className="text-sm text-muted-foreground"
                  >
                    Antepié
                  </Label>
                  <Input
                    id="forefootPct"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={forefootPct}
                    onChange={(e) =>
                      setForefootPct(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="print:border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="midfootPct"
                    className="text-sm text-muted-foreground"
                  >
                    Mediopié
                  </Label>
                  <Input
                    id="midfootPct"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={midfootPct}
                    onChange={(e) =>
                      setMidfootPct(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="print:border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="rearfootPct"
                    className="text-sm text-muted-foreground"
                  >
                    Retropié
                  </Label>
                  <Input
                    id="rearfootPct"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={rearfootPct}
                    onChange={(e) =>
                      setRearfootPct(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="print:border-none"
                  />
                </div>
              </div>
            </div>

            {/* Nota clínica */}
            <div className="space-y-2">
              <Label htmlFor="notes">Nota clínica</Label>
              <Textarea
                id="notes"
                placeholder="Ingrese observaciones clínicas…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                className="resize-none print:border-none"
              />
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 print:hidden">
              <Button
                onClick={handleSave}
                size="lg"
                variant="outline"
                disabled={!id || isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
              <Button
                onClick={handleSaveAndExit}
                size="lg"
                disabled={!id || isLoading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Guardar y Salir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <FootPreviewModal
        isOpen={open}
        onClose={() => setOpen(false)}
        modelUrl="/foot.glb"
      />
    </div>
  );
}
