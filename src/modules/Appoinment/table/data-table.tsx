import { DataTable } from "@/components/table/data-table";
import { columns } from "./columns";
import { useEffect } from "react";
import type { Appointment } from "../appointment.interface";
import { AppoinmentRowActions } from "./row-actions";
import AppoinmentFilter from "./filters";
import { useAppointmentStore } from "../data/appointment.store";

interface Props {
  onEdit: (appoinment: Appointment) => void;
}
export default function TableAppoinment({ onEdit }: Props) {
  const { fetchFull, filteredData, isLoading } = useAppointmentStore();
  useEffect(() => {
    fetchFull();
  }, [fetchFull]);
  return (
    <DataTable
      columns={[
        ...columns,
        {
          accessorKey: "actions",
          header: "Opciones",
          enableSorting: false,
          enableColumnFilter: false,
          cell: ({ row }) => (
            <AppoinmentRowActions item={row.original} onEditUser={onEdit} />
          ),
        },
      ]}
      manualPagination={false}
      data={filteredData}
      isLoading={isLoading}
      toolbarContent={<AppoinmentFilter />}
    />
  );
}
