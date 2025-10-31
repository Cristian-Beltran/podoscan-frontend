// modules/Appointment/data/appointment.store.ts
import { toast } from "sonner";
import { create } from "zustand";
import type {
  Appointment,
  UpsertAppointment,
  EditAppointmentPatientData,
} from "../appointment.interface";
import { appointmentService } from "./appointment.service";

type AppointmentStore = {
  data: Appointment[]; // caché local (si las agregas manualmente)
  filteredData: Appointment[];
  total: number;
  search: string;
  isLoading: boolean;

  // Búsqueda local
  applySearch: (term: string) => void;
  reload: () => Promise<void>;

  // CRUD soportado por el backend actual
  create: (payload: UpsertAppointment) => Promise<Appointment>;
  update: (id: string, payload: UpsertAppointment) => Promise<Appointment>;
  findOne: (id: string) => Promise<Appointment>;
  fetchFull: () => Promise<void>;

  // Clínico
  editPatientData: (
    id: string,
    payload: EditAppointmentPatientData,
  ) => Promise<Appointment>;
  uploadPhoto: (id: string, file: File) => Promise<Appointment>;

  // Utilidades opcionales para mantener la caché local coherente
  upsertLocal: (appt: Appointment) => void;
  removeLocal: (id: string) => void;
};

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  data: [],
  filteredData: [],
  total: 0,
  search: "",
  isLoading: false,

  // Filtro local por paciente, doctor, fecha (ISO) y nota
  applySearch(term) {
    set({ search: term });
    const q = (term ?? "").toLowerCase();
    const filtered = get().data.filter((item) => {
      const patientName = item.patient?.user?.fullname?.toLowerCase?.() ?? "";
      const doctorName = item.doctor?.user?.fullname?.toLowerCase?.() ?? "";
      const dateStr = item.appointmentAt?.toString?.().toLowerCase?.() ?? "";
      const note = item.note?.toLowerCase?.() ?? "";
      return (
        patientName.includes(q) ||
        doctorName.includes(q) ||
        dateStr.includes(q) ||
        note.includes(q)
      );
    });
    set({ filteredData: filtered });
  },

  async reload() {
    get().applySearch(get().search);
  },

  async fetchFull() {
    set({ isLoading: true });
    try {
      const data = await appointmentService.findAll();
      set({
        data,
        filteredData: data,
        isLoading: false,
      });
      get().applySearch(get().search);
    } catch (error) {
      console.error("Error fetching full data", error);
      toast.error("Ha ocurrido un error");
      set({ isLoading: false });
    }
  },
  // ------- Service-backed -------

  async create(payload) {
    set({ isLoading: true });
    try {
      const created = await appointmentService.create(payload);
      // Actualiza caché local
      const { data } = get();
      const next = [created, ...data];
      set({ data: next, total: next.length, isLoading: false });
      get().reload();
      toast.success("Cita creada");
      return created;
    } catch (e) {
      set({ isLoading: false });
      toast.error("No se pudo crear la cita");
      throw e;
    }
  },

  async update(id, payload) {
    set({ isLoading: true });
    try {
      const updated = await appointmentService.update(id, payload);
      const next = get().data.map((a) => (a.id === id ? updated : a));
      set({ data: next, isLoading: false });
      get().reload();
      toast.success("Cita actualizada");
      return updated;
    } catch (e) {
      set({ isLoading: false });
      toast.error("No se pudo actualizar la cita");
      throw e;
    }
  },

  async findOne(id) {
    set({ isLoading: true });
    try {
      const appt = await appointmentService.findOne(id);

      const current = get().data;
      const next = current.some((a) => a.id === appt.id)
        ? current.map((a) => (a.id === appt.id ? appt : a)) // update
        : [appt, ...current]; // insert

      set({ data: next, total: next.length, isLoading: false });
      get().reload(); // re-aplica el filtro actual
      return appt;
    } catch (e) {
      set({ isLoading: false });
      toast.error("No se pudo obtener la cita");
      throw e;
    }
  },

  async editPatientData(id, payload) {
    set({ isLoading: true });
    try {
      const updated = await appointmentService.editPatientData(id, payload);
      const next = get().data.map((a) => (a.id === id ? updated : a));
      set({ data: next, isLoading: false });
      get().reload();
      toast.success("Datos clínicos actualizados");
      return updated;
    } catch (e) {
      set({ isLoading: false });
      toast.error("No se pudieron actualizar los datos clínicos");
      throw e;
    }
  },

  async uploadPhoto(id, file) {
    set({ isLoading: true });
    try {
      const updated = await appointmentService.uploadPhoto(id, file);
      const next = get().data.map((a) => (a.id === id ? updated : a));
      set({ data: next, isLoading: false });
      get().reload();
      toast.success("Foto subida");
      return updated;
    } catch (e) {
      set({ isLoading: false });
      toast.error("No se pudo subir la foto");
      throw e;
    }
  },

  // ------- Helpers locales -------

  upsertLocal(appt) {
    const exists = get().data.some((a) => a.id === appt.id);
    const next = exists
      ? get().data.map((a) => (a.id === appt.id ? appt : a))
      : [appt, ...get().data];
    set({ data: next, total: next.length });
    get().reload();
  },

  removeLocal(id) {
    const next = get().data.filter((a) => a.id !== id);
    set({ data: next, total: next.length });
    get().reload();
  },
}));
