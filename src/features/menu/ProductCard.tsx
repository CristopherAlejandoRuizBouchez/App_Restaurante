"use client";

import { Plus, Minus } from "lucide-react";
import type { ProductDTO } from "@/modules/catalog";
import { formatMoney } from "@/lib/utils/money";
import { useCart } from "@/features/cart/cart.store";

export function ProductCard({ product }: { product: ProductDTO }) {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const setQuantity = useCart((s) => s.setQuantity);

  const inCart = items.find((i) => i.productId === product.id);

  return (
    <div className="flex items-start gap-3 border-b border-surface-border bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-tight">{product.name}</h3>

        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
            {product.description}
          </p>
        )}

        <p className="mt-1.5 font-semibold text-brand-600">
          {formatMoney(product.priceCents)}
        </p>
      </div>

      {inCart ? (
        <div className="flex items-center gap-1 rounded-xl bg-brand-50 p-1">
          <button
            onClick={() => setQuantity(product.id, inCart.quantity - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 active:bg-brand-100"
            aria-label="Quitar uno"
          >
            <Minus size={16} />
          </button>

          <span className="w-6 text-center text-sm font-semibold">
            {inCart.quantity}
          </span>

          <button
            onClick={() => setQuantity(product.id, inCart.quantity + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 active:bg-brand-100"
            aria-label="Agregar uno"
          >
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() =>
            add({
              productId: product.id,
              name: product.name,
              priceCents: product.priceCents,
            })
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white active:bg-brand-700"
          aria-label={`Agregar ${product.name}`}
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
}
