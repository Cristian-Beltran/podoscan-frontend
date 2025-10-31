// modules/Appointment/appointment.interface.ts
import type { Patient } from "@/modules/Patient/patient.interface";
import type { Doctor } from "@/modules/Doctors/doctor.interface";

/** En backend existe el tipo pero hoy no hay columna persistida */
export type FootSide = "left" | "right" | "both";

/** Métricas calculadas de la cita (coinciden con la entidad) */
export interface AppointmentMetrics {
  contactTotalPct: number; // default 0 en entidad
  forefootPct: number; // default 0 en entidad
  midfootPct: number; // default 0 en entidad
  rearfootPct: number; // default 0 en entidad
}

/** Respuesta de API para una cita (JSON): fechas en ISO string */
export interface Appointment extends AppointmentMetrics {
  id: string;
  appointmentAt: string; // ISO 8601 (backend: Date)
  originalUrl?: string | null;
  processedUrl?: string | null;
  note?: string | null; // nota clínica del doctor
  createdAt: string; // ISO 8601 (CreateDateColumn)
  patient: Patient;
  doctor: Doctor;

  /** Si tu frontend ya usa status, déjalo opcional para no romper */
  status?: string;
}

/** Crear/actualizar (upsert) una cita */
export interface UpsertAppointment {
  patientId: string;
  doctorId: string;
  appointmentAt: string; // ISO 8601 (DTO @IsDateString)
}

/** Edición de datos del paciente (coincide con EditAppoinmentPatientDataDto) */
export interface EditAppointmentPatientData {
  contactTotalPct?: number;
  forefootPct?: number;
  midfootPct?: number;
  rearfootPct?: number;
  note?: string;
}
