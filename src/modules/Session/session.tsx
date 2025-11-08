import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RotateCcw } from "lucide-react";

import { DashboardHeader } from "@/components/headerPage";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { sessionStore } from "./data/session.store";
import { SessionsTable } from "./components/sessions-table";
import { SessionCharts } from "./components/session-chars";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchByPatient } = sessionStore();

  const [activeTab, setActiveTab] = useState<"charts" | "table">("charts");

  const reload = async () => {
    if (!id) return;
    await fetchByPatient(id);
  };

  // Carga inicial
  useEffect(() => {
    if (id) {
      fetchByPatient(id);
    }
  }, [id, fetchByPatient]);

  // “Tiempo real”: refresco cada 3s solo en el tab de gráficas
  useEffect(() => {
    if (!id) return;

    if (activeTab !== "charts") {
      // Si sales del tab de gráficas, no creamos intervalo
      return;
    }

    const intervalId = window.setInterval(() => {
      fetchByPatient(id);
    }, 3000);

    // Limpieza cuando cambie el tab o se desmonte
    return () => {
      window.clearInterval(intervalId);
    };
  }, [id, activeTab, fetchByPatient]);

  return (
    <>
      <div className="space-y-6">
        <DashboardHeader
          title="Sessiones del paciente"
          description="registro de sessiones"
          actions={
            <>
              <Button
                size="icon"
                variant="outline"
                onClick={reload}
                title="Recargar ahora"
              >
                <RotateCcw />
              </Button>
            </>
          }
        />
      </div>

      <div className="space-y-6 p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "charts" | "table")}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="charts">Gráficas</TabsTrigger>
            <TabsTrigger value="table">Tabla de Datos</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            <SessionCharts />
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Datos Detallados de Sesiones</CardTitle>
                <CardDescription>
                  Todas las sesiones y registros del paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SessionsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
