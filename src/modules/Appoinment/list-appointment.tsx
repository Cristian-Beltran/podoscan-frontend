import { DashboardHeader } from "@/components/headerPage";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useParams } from "react-router-dom";
import { PlantarPhotosGallery } from "./components/cards-appointment";

export default function GalleryPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <div className="space-y-6">
        <DashboardHeader
          title="Galleria de citas"
          description="lista de citas de paciente"
          actions={
            <>
              <Button
                size={"icon"}
                variant="outline"
                onClick={() => console.log("recargar")}
                title="Recargar"
              >
                <RotateCcw />
              </Button>
            </>
          }
        ></DashboardHeader>
      </div>

      <div className="p-6 space-y-6">
        {id && <PlantarPhotosGallery patientId={id} />}
      </div>
    </>
  );
}
