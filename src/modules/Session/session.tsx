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
import { SessionTodayLive } from "./components/session-today"; // ✅ nuevo

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchByPatient, sessions } = sessionStore();

  const [activeTab, setActiveTab] = useState<"charts" | "table" | "today">(
    "charts",
  );

  const reload = async () => {
    if (!id) return;
    await fetchByPatient(id);
  };

  useEffect(() => {
    if (id) fetchByPatient(id);
  }, [id, fetchByPatient]);

  // ✅ “Tiempo real”: refresco cada 3s SOLO en el tab de HOY
  useEffect(() => {
    if (!id) return;
    if (activeTab !== "today") return;

    const intervalId = window.setInterval(() => {
      fetchByPatient(id);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [id, activeTab, fetchByPatient]);

  return (
    <>
      <div className="space-y-6">
        <DashboardHeader
          title="Sessiones del paciente"
          description="registro de sessiones"
          actions={
            <Button
              size="icon"
              variant="outline"
              onClick={reload}
              title="Recargar ahora"
            >
              <RotateCcw />
            </Button>
          }
        />
      </div>

      <div className="space-y-6 p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "charts" | "table" | "today")
          }
          className="w-full"
        >
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="charts">Gráficas</TabsTrigger>
            <TabsTrigger value="table">Tabla de Datos</TabsTrigger>
            <TabsTrigger value="today">Hoy (Tiempo real)</TabsTrigger>
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

          <TabsContent value="today" className="space-y-4">
            <SessionTodayLive sessions={sessions} onReload={reload} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
