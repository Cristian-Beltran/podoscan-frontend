// src/components/layout/Header.tsx
import React, { useMemo } from "react";
import {
  Menu,
  Footprints,
  ScanLine,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/auth/useAuth";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, className }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const initials = useMemo(() => {
    const name = (user?.fullname ?? "Usuario").trim();
    const parts = name.split(/\s+/);
    return parts.length === 1
      ? parts[0].charAt(0).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user?.fullname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-gradient-to-b from-background/60 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b border-border/60",
        className,
      )}
      role="banner"
    >
      {/* Línea superior viva, más gruesa y centrada */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-primary to-emerald-500" />

      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="grid grid-cols-2 md:grid-cols-[auto_1fr_auto] items-center py-3 gap-2">
          {/* Izquierda: menú móvil + CTA principal */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={onMenuClick}
              aria-label="Abrir menú lateral"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/appointment">
              <Button size="sm" className="rounded-2xl px-4 py-2 shadow-sm">
                <ScanLine className="mr-2 h-4 w-4" />
                Ver citas
              </Button>
            </Link>
          </div>

          {/* Centro: separador visual (sin contenidos) */}
          <div className="hidden md:flex items-center justify-center">
            <div className="h-6 w-px bg-border/70 rounded-full" />
          </div>

          {/* Derecha: branding + usuario */}
          <div className="flex items-center justify-end gap-3">
            <div className="hidden sm:flex items-center gap-2 pr-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Footprints className="h-5 w-5 text-primary" />
              </div>
              <div className="leading-tight text-right">
                <div className="text-sm font-semibold tracking-tight">
                  PodoScan
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Análisis plantar
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label="Menú de usuario"
                >
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                    {initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">
                  Sesión
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => {
                    logout?.();
                    navigate("/login");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
