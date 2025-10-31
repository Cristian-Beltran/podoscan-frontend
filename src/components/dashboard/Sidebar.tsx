// src/components/layout/Sidebar.tsx
import type React from "react";
import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Sun,
  Moon,
  Droplet,
  ChevronRight,
  ChevronLeft,
  Users,
  PlusCircleIcon,
  CalendarCheck,
  Microchip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthStore } from "@/auth/useAuth";

interface SidebarProps {
  isOpen: boolean; // móvil
  onClose: () => void; // móvil
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Dispositivos", href: "/devices", icon: Microchip },
  { name: "Pacientes", href: "/patients", icon: User },
  { name: "Doctores", href: "/doctor", icon: PlusCircleIcon },
  { name: "Familiares", href: "/family", icon: Users },
  { name: "Citas", href: "/appointment", icon: CalendarCheck },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const [expanded, setExpanded] = useState<boolean>(false);

  const initials = useMemo(() => {
    const base = (user?.fullname ?? "U").trim();
    const parts = base.split(/\s+/);
    return (parts[0]?.[0] ?? "U")
      .concat(parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")
      .toUpperCase();
  }, [user?.fullname]);

  const isActive = (href: string) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

  const backgroundStyle: React.CSSProperties = {
    backgroundImage:
      "radial-gradient(1200px 1200px at -10% -10%, rgba(34,197,94,0.10), transparent 60%), radial-gradient(1200px 1200px at 110% 110%, rgba(59,130,246,0.10), transparent 60%)",
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border/60 shadow-md",
          "bg-sidebar/90 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80",
          "transition-[transform,width] duration-300 ease-in-out",
          "lg:m-3 lg:rounded-2xl lg:h-[calc(100vh-1.5rem)]",
          expanded ? "lg:w-72" : "lg:w-20",
          isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
        )}
        style={backgroundStyle}
        aria-label="Navegación"
      >
        {/* Brand + rail toggle */}
        <div
          className={cn(
            "relative flex items-center",
            expanded ? "px-4" : "px-2",
            "py-4",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary/15 text-primary">
              <Droplet className="h-4 w-4" />
            </div>
            {expanded && (
              <div className="leading-tight">
                <div className="text-sm font-semibold">PodoScan</div>
                <div className="text-[11px] text-muted-foreground">
                  Análisis plantar
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 lg:hidden rounded-xl"
            aria-label="Cerrar sidebar"
          >
            ✕
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden lg:inline-flex rounded-xl"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Colapsar" : "Expandir"}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Acción global (arriba) */}
        <div className={cn(expanded ? "px-4" : "px-2")}>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-center rounded-2xl border-dashed",
              expanded ? "px-3" : "px-0",
            )}
            onClick={() => {
              onClose();
              navigate("/appointments/new");
            }}
          >
            +
          </Button>
        </div>

        {/* Navegación (píldoras con indicador a la izquierda) */}
        <nav
          className={cn("mt-3 space-y-1", expanded ? "px-3" : "px-2")}
          aria-label="Principal"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  expanded ? "px-3 py-2.5" : "px-2.5 py-2 justify-center",
                  active
                    ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {/* Indicador al borde izquierdo */}
                <span
                  className={cn(
                    "absolute left-1.5 h-6 w-1 rounded-full",
                    active
                      ? "bg-primary"
                      : "bg-transparent group-hover:bg-muted-foreground/40",
                  )}
                />
                <span
                  className={cn(
                    "grid place-items-center rounded-xl h-9 w-9 shrink-0",
                    active
                      ? "bg-primary/20"
                      : "bg-muted/40 group-hover:bg-muted/60",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {expanded && (
                  <span className="ml-3 text-sm font-medium truncate">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer minimal */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 border-t border-border/60",
            expanded ? "px-3" : "px-2",
            "py-3",
          )}
        >
          <div
            className={cn(
              "mb-2 flex items-center gap-3 rounded-xl bg-muted/40",
              expanded ? "px-3 py-2.5" : "px-2 py-2 justify-center",
            )}
          >
            <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-semibold">{initials}</span>
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.fullname ?? "Usuario"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.email ?? ""}
                </p>
              </div>
            )}
          </div>

          <div className={cn("flex", expanded ? "gap-2" : "flex-col gap-2")}>
            <Button
              variant="ghost"
              className={cn(
                "justify-start rounded-xl",
                expanded ? "w-full px-3" : "w-full px-0 justify-center",
              )}
              onClick={toggleTheme}
              title={theme === "light" ? "Modo oscuro" : "Modo claro"}
              aria-label={
                theme === "light" ? "Activar modo oscuro" : "Activar modo claro"
              }
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              {expanded && <span className="ml-2 text-sm">Tema</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
