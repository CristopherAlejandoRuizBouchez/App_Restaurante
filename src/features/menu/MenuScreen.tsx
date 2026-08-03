"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import type { MenuCategoryDTO } from "@/modules/catalog";
import { apiFetch } from "@/lib/utils/api-client";
import { cn } from "@/lib/utils/cn";
import { ProductCard } from "./ProductCard";
import { CartBar } from "@/features/cart/CartBar";

interface MenuScreenProps {
  tableCode: string;
  tableLabel: string;
  restaurantName: string;
  menu: MenuCategoryDTO[];
}

export function MenuScreen({
  tableCode,
  tableLabel,
  restaurantName,
  menu,
}: MenuScreenProps) {
  const [active, setActive] = useState<string | null>(menu[0]?.id ?? null);

  // Cuenta de pedidos activos, para el indicador.
  const { data } = useQuery({
    queryKey: ["session-orders"],
    queryFn: () =>
      apiFetch<{ orders: { status: string }[] }>("/api/public/orders"),
    refetchInterval: 20000,
  });

  const activeOrders = (data?.orders ?? []).filter(
    (o) => o.status !== "CANCELLED" && o.status !== "DELIVERED",
  ).length;

  const scrollTo = (id: string) => {
    setActive(id);
    document
      .getElementById(`cat-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (menu.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="font-medium">{restaurantName}</p>
        <p className="text-ink-muted">
          El menú no está disponible en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 border-b border-surface-border bg-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{restaurantName}</p>
            <p className="text-xs text-ink-muted">{tableLabel}</p>
          </div>

          <Link
            href={`/m/${tableCode}/cuenta`}
            className="relative flex shrink-0 items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-sm font-medium"
          >
            <Receipt size={16} />
            Mis pedidos
            {activeOrders > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white">
                {activeOrders}
              </span>
            )}
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {menu.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollTo(cat.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                active === cat.id
                  ? "bg-brand-600 text-white"
                  : "bg-surface-muted text-ink-muted",
              )}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {menu.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
            <h2 className="px-4 pb-2 pt-5 text-sm font-semibold uppercase tracking-wide text-ink-muted">
              {cat.name}
            </h2>

            {cat.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        ))}
      </main>

      <CartBar tableCode={tableCode} />
    </div>
  );
}
