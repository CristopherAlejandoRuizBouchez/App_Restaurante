"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  LayoutGrid,
  LogOut,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { apiFetch } from "@/lib/utils/api-client";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/panel", label: "Pedidos", icon: ClipboardList },
  { href: "/panel/sala", label: "Sala", icon: Users },
  { href: "/panel/menu", label: "Menú", icon: UtensilsCrossed },
  { href: "/panel/mesas", label: "Mesas", icon: LayoutGrid },
];

export function PanelNav({
  actorName,
  role,
  restaurantName,
}: {
  actorName: string;
  role: string;
  restaurantName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await apiFetch("/api/internal/auth/logout", { method: "POST" });
    router.push("/entrar");
    router.refresh();
  };

  return (
    <>
      {/* Barra lateral en escritorio */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-surface-border bg-surface p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="truncate text-base font-semibold">{restaurantName}</p>
          <p className="truncate text-xs text-ink-muted">
            {actorName} · {role}
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/panel" ? pathname === href : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-muted hover:bg-surface-muted",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted hover:bg-surface-muted"
        >
          <LogOut size={18} />
          Salir
        </button>
      </aside>

      {/* Encabezado en móvil */}
      <header className="border-b border-surface-border bg-surface px-4 py-3 md:hidden">
        <p className="truncate font-semibold">{restaurantName}</p>
        <p className="truncate text-xs text-ink-muted">
          {actorName} · {role}
        </p>
      </header>

      {/* Barra inferior en móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-surface-border bg-surface md:hidden">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/panel" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs",
                active ? "text-brand-600" : "text-ink-muted",
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}

        <button
          onClick={logout}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-ink-muted"
        >
          <LogOut size={20} />
          Salir
        </button>
      </nav>
    </>
  );
}
