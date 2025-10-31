import type { ColumnDef } from "@tanstack/react-table";
import type { Appointment } from "../appointment.interface";

// Helper de fecha legible (ajusta a tu i18n)
const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "—";

export const columns: ColumnDef<Appointment>[] = [
  {
    id: "appointmentAt",
    header: "Fecha / Hora",
    accessorFn: (row) => row.appointmentAt, // base para ordenar/filtrar
    cell: ({ getValue }) => fmtDateTime(getValue<string>()),
    sortingFn: "datetime",
  },
  {
    id: "patient",
    header: "Paciente",
    accessorKey: "patient.user.fullname",
  },
  {
    id: "doctor",
    header: "Doctor",
    accessorKey: "doctor.user.fullname",
  },
];
