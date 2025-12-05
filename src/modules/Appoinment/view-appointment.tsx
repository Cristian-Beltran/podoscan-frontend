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
import type {
  Appointment,
  EditAppointmentPatientData,
} from "./appointment.interface";
import { useNavigate, useParams } from "react-router-dom";
import FootPreviewModal from "./components/foot-model";

// ✅ importa cliente MQTT correcto (usa mqtt/dist/mqtt.min.js dentro)
import { getMqtt, sendLed, sendServo } from "@/lib/mqtt";

// ✅ nuevos modales 3D
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AppointmentViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [open, setOpen] = useState(false);
  const [open3dFoot, setOpen3dFoot] = useState(false);
  const [open3dFootBone, setOpen3dFootBone] = useState(false);

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

  // 👉 nuevos campos geométricos
  const [forefootWidthMm, setForefootWidthMm] = useState<number | "">("");
  const [isthmusWidthMm, setIsthmusWidthMm] = useState<number | "">("");
  const [chippauxSmirakIndex, setChippauxSmirakIndex] = useState<number | "">(
    "",
  );

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

    setForefootWidthMm(
      appt.forefootWidthMm !== null && appt.forefootWidthMm !== undefined
        ? appt.forefootWidthMm
        : "",
    );
    setIsthmusWidthMm(
      appt.isthmusWidthMm !== null && appt.isthmusWidthMm !== undefined
        ? appt.isthmusWidthMm
        : "",
    );
    setChippauxSmirakIndex(
      appt.chippauxSmirakIndex !== null &&
        appt.chippauxSmirakIndex !== undefined
        ? appt.chippauxSmirakIndex
        : "",
    );

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

      // URLs
      setOriginalUrl(updated.originalUrl ?? null);
      setProcessedUrl(updated.processedUrl ?? null);

      // Métricas de presión
      setContactTotalPct(updated.contactTotalPct ?? 0);
      setForefootPct(updated.forefootPct ?? 0);
      setMidfootPct(updated.midfootPct ?? 0);
      setRearfootPct(updated.rearfootPct ?? 0);

      // Métricas geométricas
      setForefootWidthMm(
        updated.forefootWidthMm !== null &&
          updated.forefootWidthMm !== undefined
          ? updated.forefootWidthMm
          : "",
      );
      setIsthmusWidthMm(
        updated.isthmusWidthMm !== null && updated.isthmusWidthMm !== undefined
          ? updated.isthmusWidthMm
          : "",
      );
      setChippauxSmirakIndex(
        updated.chippauxSmirakIndex !== null &&
          updated.chippauxSmirakIndex !== undefined
          ? updated.chippauxSmirakIndex
          : "",
      );

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
      const payload: EditAppointmentPatientData = {
        note,
      };

      // Solo mandamos lo que tenga valor, para no pisar con 0/null sin querer
      if (contactTotalPct !== "")
        payload.contactTotalPct = Number(contactTotalPct);
      if (forefootPct !== "") payload.forefootPct = Number(forefootPct);
      if (midfootPct !== "") payload.midfootPct = Number(midfootPct);
      if (rearfootPct !== "") payload.rearfootPct = Number(rearfootPct);

      if (forefootWidthMm !== "")
        payload.forefootWidthMm = Number(forefootWidthMm);
      if (isthmusWidthMm !== "")
        payload.isthmusWidthMm = Number(isthmusWidthMm);
      if (chippauxSmirakIndex !== "")
        payload.chippauxSmirakIndex = Number(chippauxSmirakIndex);

      await editPatientData(id, payload);
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

                {/* Botones 3D */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full print:hidden bg-transparent"
                    onClick={() => setOpen(true)}
                    disabled={isProcessing || !id}
                  >
                    <Footprints className="mr-2 h-4 w-4" />
                    Ver pie 3D (GLB)
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full print:hidden bg-transparent"
                    onClick={() => setOpen3dFoot(true)}
                    disabled={isProcessing}
                  >
                    3D Pie plano
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full print:hidden bg-transparent"
                    onClick={() => setOpen3dFootBone(true)}
                    disabled={isProcessing}
                  >
                    3D Pie curvo
                  </Button>
                </div>
              </div>
            </div>

            {/* Métricas porcentuales */}
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
                    disabled
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
                    disabled
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
                    disabled
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
                    disabled
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

            {/* 👉 Métricas geométricas / índice Chippaux-Smirak */}
            <div className="space-y-2">
              <Label>Métricas geométricas</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="forefootWidthMm"
                    className="text-sm text-muted-foreground"
                  >
                    Ancho antepié (cm)
                  </Label>
                  <Input
                    id="forefootWidthMm"
                    type="number"
                    disabled
                    inputMode="decimal"
                    placeholder="0"
                    value={forefootWidthMm}
                    onChange={(e) =>
                      setForefootWidthMm(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="print:border-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="isthmusWidthMm"
                    className="text-sm text-muted-foreground"
                  >
                    Ancho istmo (cm)
                  </Label>
                  <Input
                    id="isthmusWidthMm"
                    type="number"
                    disabled
                    inputMode="decimal"
                    placeholder="0"
                    value={isthmusWidthMm}
                    onChange={(e) =>
                      setIsthmusWidthMm(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="print:border-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="chippauxSmirakIndex"
                    className="text-sm text-muted-foreground"
                  >
                    Índice Chippaux-Smirak (%)
                  </Label>
                  <Input
                    id="chippauxSmirakIndex"
                    disabled
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={chippauxSmirakIndex}
                    onChange={(e) =>
                      setChippauxSmirakIndex(
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

      {/* Modal 3D GLB actual */}
      <FootPreviewModal
        isOpen={open}
        onClose={() => setOpen(false)}
        modelUrl="/foot.glb"
      />

      {/* 🔹 Modal 3D Pie (iframe) */}
      <Dialog open={open3dFoot} onOpenChange={setOpen3dFoot}>
        <DialogContent className="min-w-[90vw] md:min-w-3xl ">
          <DialogHeader>
            <DialogTitle>3D Pie y hueso</DialogTitle>
          </DialogHeader>
          <div className="mt-2 h-[70vh]">
            <iframe
              width="640"
              height="480"
              loading="lazy"
              src="https://p3d.in/e/Q9frV"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔹 Modal 3D Pie y Hueso (iframe) */}
      <Dialog open={open3dFootBone} onOpenChange={setOpen3dFootBone}>
        <DialogContent className="min-w-[90vw] md:min-w-3xl ">
          <DialogHeader>
            <DialogTitle>3D Pie y Hueso</DialogTitle>
          </DialogHeader>
          <div className="mt-2 h-[70vh]">
            <iframe
              width="640"
              height="480"
              loading="lazy"
              src="https://p3d.in/e/ICU9r"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
