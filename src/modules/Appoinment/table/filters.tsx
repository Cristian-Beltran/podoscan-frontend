import { Input } from "@/components/ui/input";
import { useAppointmentStore } from "../data/appointment.store";

export default function AppoinmentFilter() {
  const { search, applySearch } = useAppointmentStore();
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <Input
        placeholder="Buscar por nombre"
        defaultValue={search}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") {
            applySearch((e.target as HTMLInputElement).value);
          }
        }}
        className="w-2xs"
      />
    </div>
  );
}
