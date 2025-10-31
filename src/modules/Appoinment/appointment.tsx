import { DashboardHeader } from "@/components/headerPage";
import TableAppoinment from "./table/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, RotateCcw } from "lucide-react";
import { useAppointmentStore } from "./data/appointment.store";
import type { Appointment } from "./appointment.interface";
import { useState } from "react";
import AppoinmentFormModal from "./modal-form";

export default function AppoinmentPage() {
  const [selectedUser, setSelectedUser] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchFull } = useAppointmentStore();

  const openForCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openForEdit = (user: Appointment) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  return (
    <>
      <div className="space-y-6">
        <DashboardHeader
          title="Citas"
          description="Lista de citas"
          actions={
            <>
              <Button onClick={openForCreate}>
                <PlusCircle />
                Crear
              </Button>
              <Button
                size={"icon"}
                variant="outline"
                onClick={fetchFull}
                title="Recargar"
              >
                <RotateCcw />
              </Button>
            </>
          }
        ></DashboardHeader>
      </div>

      <div className="p-6 space-y-6">
        <TableAppoinment onEdit={openForEdit} />
      </div>

      <AppoinmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />
    </>
  );
}
