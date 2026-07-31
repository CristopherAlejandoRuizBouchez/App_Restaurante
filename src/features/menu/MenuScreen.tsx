"use client";

import { useState } from "react";
import type { MenuCategoryDTO } from "@/modules/catalog";
import { cn } from "@/lib/utils/cn";
import { ProductCard } from "./ProductCard";
import { CartBar } from "@/features/cart/CartBar";

interface MenuScreenProps {
  tableCode: string;
  tableLabel: string;
  menu: MenuCategoryDTO[];
}

export function MenuScreen({ tableCode, tableLabel, menu }: MenuScreenProps) {
  const [active, setActive] = useState<string | null>(menu[0]?.id ?? null);

  const scrollTo = (id: string) => {
    setActive(id);
    document
      .getElementById(`cat-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (menu.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8 text-center">
        <p className="text-ink-muted">
          El menú no está disponible en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 border-b border-surface-border bg-surface">
        <div className="px-4 py-3">
          <p className="text-xs text-ink-muted">Estás en</p>
          <h1 className="text-lg font-semibold">{tableLabel}</h1>
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
