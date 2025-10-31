import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { Appointment } from "./appointment.interface";
import type { Patient } from "../Patient/patient.interface";
import type { Doctor } from "../Doctors/doctor.interface";

import { useAppointmentStore } from "./data/appointment.store";
import { patientService } from "../Patient/data/patient.service"; // ajusta ruta si difiere
import { doctorService } from "../Doctors/data/doctor.service"; // idem

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: Appointment | null;
}

// Esquema para upsert de cita (DTO: UpsertAppoinmentDto)
const appointmentSchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  doctorId: z.string().uuid("Doctor inválido"),
  appointmentAt: z.string().min(1, "Fecha y hora requeridas"), // ISO string
});
type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function AppointmentFormModal({ isOpen, onClose, user }: Props) {
  const { create, update } = useAppointmentStore();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentAt: "",
    },
  });

  // cargar pacientes y doctores
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingLists(true);
      try {
        const [pats, docs] = await Promise.all([
          patientService.findAll(),
          doctorService.findAll(),
        ]);
        if (!mounted) return;
        setPatients(pats ?? []);
        setDoctors(docs ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoadingLists(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen]);
  const patientOptions = patients.map((p) => ({
    value: p.user.id,
    label: p.user?.fullname ?? "(Sin nombre)",
  }));
  const doctorOptions = doctors.map((d) => ({
    value: d.user.id,
    label: d.user?.fullname ?? "(Sin nombre)",
  }));

  // helper local -> datetime-local (SIN convertir a UTC)
  function toLocalInputValue(iso: string | Date) {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`; // <-- local time
  }

  // hidratar edición / creación
  useEffect(() => {
    if (user) {
      // appointmentAt viene ISO; para <input type="datetime-local"> conviene quitar 'Z' y segundos si molestan

      form.reset({
        patientId: user.patient.user?.id ?? "",
        doctorId: user.doctor.user?.id ?? "",
        appointmentAt: user.appointmentAt
          ? toLocalInputValue(user.appointmentAt)
          : "",
      });
    } else {
      form.reset({
        patientId: "",
        doctorId: "",
        appointmentAt: "",
      });
    }
  }, [user, form, isOpen]);

  const onSubmit = async (values: AppointmentFormValues) => {
    // Normaliza a ISO (UTC) desde el control datetime-local
    const isoUtc = values.appointmentAt
      ? new Date(values.appointmentAt).toISOString()
      : "";

    const payload = {
      patientId: values.patientId,
      doctorId: values.doctorId,
      appointmentAt: isoUtc,
    };

    try {
      if (user) {
        await update(user.id, payload);
        toast.success("Cita actualizada");
      } else {
        await create(payload);
        toast.success("Cita creada");
      }
      onClose();
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        toast.error("Ha ocurrido un error");
        return;
      }
      const msg = error.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : (msg ?? "Error inesperado"),
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Cita" : "Crear Cita"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Paciente */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loadingLists}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingLists ? "Cargando..." : "Selecciona paciente"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {patientOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Doctor */}
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loadingLists}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingLists ? "Cargando..." : "Selecciona doctor"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {doctorOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha y hora */}
            <FormField
              control={form.control}
              name="appointmentAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha y hora</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {user ? "Editar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
