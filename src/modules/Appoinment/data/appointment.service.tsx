// modules/Appointment/appointment.service.ts
import axios from "@/lib/axios";
import type {
  Appointment,
  UpsertAppointment,
  EditAppointmentPatientData,
} from "../appointment.interface";

const BASE_URL = "/appoinments"; // coincide con tu controller

export const appointmentService = {
  /**
   * Crear cita (doctor, paciente, fecha)
   * POST /appoinments  Body: UpsertAppointment
   */
  create: async (data: UpsertAppointment): Promise<Appointment> => {
    const res = await axios.post(BASE_URL, data);
    return res.data;
  },

  /**
   *
   * Obtener todas las citas
   */
  findAll: async (): Promise<Appointment[]> => {
    const res = await axios.get(BASE_URL);
    return res.data;
  },

  /**
   * Obtener una cita por id
   * GET /appoinments/:id
   */
  findOne: async (id: string): Promise<Appointment> => {
    const res = await axios.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  /**
   * Actualizar cita (doctor/paciente/fecha)
   * PUT /appoinments/:id  Body: UpsertAppointment
   */
  update: async (id: string, data: UpsertAppointment): Promise<Appointment> => {
    const res = await axios.put(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  /**
   * Editar datos clínicos (nota + métricas)
   * PATCH /appoinments/:id/patient-data  Body: EditAppointmentPatientData
   */
  editPatientData: async (
    id: string,
    data: EditAppointmentPatientData,
  ): Promise<Appointment> => {
    const res = await axios.patch(`${BASE_URL}/${id}/patient-data`, data);
    return res.data;
  },

  /**
   * Subir foto cruda de la cita (multipart/form-data, field "file")
   * POST /appoinments/:id/photo
   */
  uploadPhoto: async (id: string, file: File): Promise<Appointment> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await axios.post(`${BASE_URL}/${id}/photo`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  listByPatient: async (patientId: string): Promise<Appointment[]> => {
    const res = await axios.get(`${BASE_URL}/by-patient/${patientId}`);
    return res.data;
  },
};
