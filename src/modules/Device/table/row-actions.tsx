import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pen, XCircle } from "lucide-react";
import type { Device } from "../device.interface";
import { userDeviceStore } from "../data/device.store";

interface Props {
  item: Device;
  onEditUser: (user: Device) => void;
}

export const DeviceRowActions = ({ item, onEditUser }: Props) => {
  const { remove, unlink } = userDeviceStore();

  const handleUpdate = () => {
    onEditUser(item); // Abre el modal de edición
  };

  const handleDelete = () => {
    remove(item.id);
  };

  const handleUnlink = () => {
    unlink(item.id);
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
          <DropdownMenuItem onClick={handleDelete}>
            <XCircle /> Eliminar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUpdate}>
            <Pen /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUnlink}>
            <XCircle /> Desvincular
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
