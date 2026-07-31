"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import { apiFetch, ApiError } from "@/lib/utils/api-client";
import { useCart } from "./cart.store";

interface CreatedOrder {
  order: { id: string; orderNumber: string };
}

export function CartScreen({ tableCode }: { tableCode: string }) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const setNotes = useCart((s) => s.setNotes);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const [orderNotes, setOrderNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<string | null>(null);

  const total = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  const submit = async () => {
    setSending(true);
    setError(null);

    try {
      const data = await apiFetch<CreatedOrder>("/api/public/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            ...(i.notes ? { notes: i.notes } : {}),
          })),
          ...(orderNotes ? { notes: orderNotes } : {}),
        }),
      });

      clear();
      router.push(`/m/${tableCode}/orders/${data.order.id}`);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No pudimos enviar tu pedido. Intentá de nuevo.",
      );
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-ink-muted">Tu carrito está vacío</p>
        <Link href={`/m/${tableCode}`}>
          <Button variant="secondary">Ver el menú</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-40">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-surface-border bg-surface px-4 py-3">
        <Link
          href={`/m/${tableCode}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg active:bg-surface-muted"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold">Tu pedido</h1>
      </header>

      <ul className="divide-y divide-surface-border bg-surface">
        {items.map((item) => (
          <li key={item.productId} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{item.name}</p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {formatMoney(item.priceCents)} c/u
                </p>

                {item.notes && (
                  <p className="mt-1 text-sm italic text-brand-600">
                    {item.notes}
                  </p>
                )}

                <button
                  onClick={() =>
                    setOpenNotes(
                      openNotes === item.productId ? null : item.productId,
                    )
                  }
                  className="mt-1.5 text-xs font-medium text-ink-muted underline"
                >
                  {item.notes ? "Editar nota" : "Agregar nota"}
                </button>
              </div>

              <div className="flex flex-col items-end gap-2">
                <p className="font-semibold">
                  {formatMoney(item.priceCents * item.quantity)}
                </p>

                <div className="flex items-center gap-1 rounded-xl bg-surface-muted p-1">
                  <button
                    onClick={() =>
                      item.quantity === 1
                        ? remove(item.productId)
                        : setQuantity(item.productId, item.quantity - 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-surface-border"
                    aria-label="Quitar uno"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 size={15} className="text-status-cancelled" />
                    ) : (
                      <Minus size={15} />
                    )}
                  </button>

                  <span className="w-5 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      setQuantity(item.productId, item.quantity + 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-surface-border"
                    aria-label="Agregar uno"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>

            {openNotes === item.productId && (
              <input
                autoFocus
                value={item.notes ?? ""}
                onChange={(e) => setNotes(item.productId, e.target.value)}
                onBlur={() => setOpenNotes(null)}
                placeholder="Sin cebolla, término medio..."
                maxLength={300}
                className="mt-3 w-full rounded-xl border border-surface-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 bg-surface px-4 py-4">
        <label className="text-sm font-medium">Nota para la cocina</label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Alergias, preferencias, algo que debamos saber..."
          rows={2}
          maxLength={500}
          className="mt-2 w-full resize-none rounded-xl border border-surface-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-surface-border bg-surface p-4">
        {error && (
          <p className="mb-3 rounded-xl bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
            {error}
          </p>
        )}

        <div className="mb-3 flex items-center justify-between">
          <span className="text-ink-muted">Total</span>
          <span className="text-2xl font-semibold">{formatMoney(total)}</span>
        </div>

        <Button
          size="lg"
          onClick={submit}
          disabled={sending}
          className="w-full"
        >
          {sending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Enviando...
            </>
          ) : (
            "Confirmar pedido"
          )}
        </Button>
      </div>
    </div>
  );
}
