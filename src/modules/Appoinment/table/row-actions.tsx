import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, MoreHorizontal, Pen } from "lucide-react";
import type { Appointment } from "../appointment.interface";
import { useNavigate } from "react-router-dom";

interface Props {
  item: Appointment;
  onEditUser: (user: Appointment) => void;
}

export const AppoinmentRowActions = ({ item, onEditUser }: Props) => {
  const navigate = useNavigate();
  const viewAppointment = () => {
    console.log(item.id);
    navigate(item.id);
  };

  const handleUpdate = () => {
    onEditUser(item); // Abre el modal de edición
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleUpdate}>
            <Pen /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={viewAppointment}>
            <LogIn /> Ingresar a la cita
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
