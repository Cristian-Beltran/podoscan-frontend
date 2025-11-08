import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardHeader } from "@/components/headerPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Users,
  Mail,
  Activity,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/auth/useAuth";
import { FamilyService } from "@/modules/Family/data/family.service";
import type { Family } from "@/modules/Family/family.interface";

// ===== Utils =====
function getInitials(name?: string) {
  if (!name) return "—";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function fmtEmail(email?: string) {
  return email || "—";
}

// ===== Tile variants =====
function PatientCard({
  id,
  fullname,
  email,
  deviceSerial,
  comfy,
}: {
  id: string;
  fullname: string;
  email: string;
  deviceSerial?: string;
  comfy: boolean;
}) {
  return (
    <Card
      className={`group relative overflow-hidden transition-shadow hover:shadow-lg ${comfy ? "p-0" : "p-0"}`}
    >
      {/* Ribbon */}
      <div className="absolute right-3 top-3 z-10">
        {deviceSerial ? (
          <Badge variant="secondary" className="gap-1">
            <Activity className="h-3.5 w-3.5" /> {deviceSerial}
          </Badge>
        ) : (
          <Badge variant="outline">Sin dispositivo</Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className={`flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 border border-emerald-300 shadow-sm ${
              comfy ? "h-16 w-16 text-xl" : "h-12 w-12 text-base"
            }`}
          >
            {getInitials(fullname)}
          </div>
          <div className="min-w-0">
            <CardTitle className={comfy ? "text-lg" : "text-base"}>
              <span className="truncate block" title={fullname}>
                {fullname}
              </span>
            </CardTitle>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span
                className={`truncate ${comfy ? "text-base" : "text-sm"}`}
                title={fmtEmail(email)}
              >
                {fmtEmail(email)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {deviceSerial ? "Dispositivo activo" : "En espera de asignación"}
          </div>
          <Link to={`/me/${id}`}>
            <Button size={comfy ? "lg" : "sm"} className="group/button">
              Ver datos
              <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/button:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function PatientRow({
  id,
  fullname,
  email,
  deviceSerial,
}: {
  id: string;
  fullname: string;
  email: string;
  deviceSerial?: string;
}) {
  return (
    <div className="grid grid-cols-12 items-center rounded-xl border p-3 hover:bg-muted/40">
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm">
          {getInitials(fullname)}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate" title={fullname}>
            {fullname}
          </div>
          <div
            className="text-xs text-muted-foreground truncate"
            title={fmtEmail(email)}
          >
            {fmtEmail(email)}
          </div>
        </div>
      </div>
      <div className="col-span-3">
        {deviceSerial ? (
          <Badge variant="secondary" className="gap-1">
            <Activity className="h-3.5 w-3.5" /> {deviceSerial}
          </Badge>
        ) : (
          <Badge variant="outline">Sin dispositivo</Badge>
        )}
      </div>
      <div className="col-span-3 flex justify-end">
        <Link to={`/me/${id}`}>
          <Button size="sm" variant="default" className="group">
            Ver datos{" "}
            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ===== Page =====
export default function FamilyPatientsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"az" | "za" | "device">("az");
  const [comfy, setComfy] = useState(false);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const reload = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await FamilyService.findOne(user.id);
      setFamily(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los pacientes",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Derived
  const patients = family?.patients ?? [];

  const filtered = useMemo(() => {
    const q = debounced.toLowerCase();
    const base = q
      ? patients.filter(
          (p) =>
            (p.user.fullname || "").toLowerCase().includes(q) ||
            (p.user.email || "").toLowerCase().includes(q),
        )
      : patients;
    const sorted = [...base].sort((a, b) => {
      if (sort === "az")
        return (a.user.fullname || "").localeCompare(b.user.fullname || "");
      if (sort === "za")
        return (b.user.fullname || "").localeCompare(a.user.fullname || "");
      // device first
      const aHas = a.device?.serialNumber ? 1 : 0;
      const bHas = b.device?.serialNumber ? 1 : 0;
      return (
        bHas - aHas ||
        (a.user.fullname || "").localeCompare(b.user.fullname || "")
      );
    });
    return sorted;
  }, [patients, debounced, sort]);

  const kpis = useMemo(() => {
    const total = patients.length;
    const withDevice = patients.filter((p) => !!p.device?.serialNumber).length;
    return { total, withDevice, withoutDevice: total - withDevice } as const;
  }, [patients]);

  return (
    <div className="space-y-6" role="main" aria-live="polite">
      <DashboardHeader
        title="Mi grupo familiar"
        description="Gestión de pacientes vinculados"
        actions={
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 rounded-xl border bg-background px-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-none focus-visible:ring-0 w-[260px]"
              />
            </div>

            {/* Density toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={comfy}
                    onPressedChange={setComfy}
                    aria-label="Modo cómodo"
                  >
                    <Users className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tamaño de tarjetas más grande</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* View toggle */}
            <div className="flex rounded-xl border overflow-hidden">
              <Button
                variant={view === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("grid")}
                aria-label="Vista en tarjetas"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("list")}
                aria-label="Vista en lista"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Sort */}
            <Select
              value={sort}
              onValueChange={(v: "az" | "za" | "device") => setSort(v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="az">Nombre A-Z</SelectItem>
                <SelectItem value="za">Nombre Z-A</SelectItem>
                <SelectItem value="device">Con dispositivo primero</SelectItem>
              </SelectContent>
            </Select>

            {/* Reload */}
            <Button
              variant="outline"
              size="icon"
              onClick={reload}
              title="Recargar"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        }
      />

      {/* buscador en mobile */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 rounded-xl border bg-background px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">
              Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">
              Con dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{kpis.withDevice}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">
              Sin dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{kpis.withoutDevice}</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando pacientes…
            </div>
          )}

          {!loading && patients.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-sm md:text-base text-muted-foreground">
                No hay pacientes vinculados a este familiar.
                <div className="mt-1 text-xs md:text-sm">
                  Si esperabas ver pacientes, solicita al médico que confirme el
                  vínculo familiar.
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && patients.length > 0 && filtered.length === 0 && (
            <div className="text-sm md:text-base text-muted-foreground">
              No se encontraron resultados para “{debounced}”.
            </div>
          )}

          {!loading &&
            filtered.length > 0 &&
            (view === "grid" ? (
              <div
                className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`}
              >
                {filtered.map((p) => (
                  <PatientCard
                    key={p.id}
                    id={p.id}
                    fullname={p.user.fullname}
                    email={p.user.email}
                    deviceSerial={p.device?.serialNumber}
                    comfy={comfy}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-2">
                {filtered.map((p) => (
                  <PatientRow
                    key={p.id}
                    id={p.id}
                    fullname={p.user.fullname}
                    email={p.user.email}
                    deviceSerial={p.device?.serialNumber}
                  />
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
