"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, Loader2, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import { apiFetch, ApiError } from "@/lib/utils/api-client";
import { cn } from "@/lib/utils/cn";
import { SessionClosed } from "./SessionClosed";

type Status =
  "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";

interface OrderResponse {
  order: {
    id: string;
    orderNumber: string;
    status: Status;
    totalCents: number;
    notes: string | null;
    cancelledReason: string | null;
    items: {
      id: string;
      productName: string;
      quantity: number;
      lineTotalCents: number;
      notes: string | null;
    }[];
  };
}

const STEPS: { status: Status; label: string }[] = [
  { status: "PENDING", label: "Recibido" },
  { status: "CONFIRMED", label: "Confirmado" },
  { status: "PREPARING", label: "En preparación" },
  { status: "READY", label: "Listo" },
  { status: "DELIVERED", label: "Entregado" },
];

const MESSAGES: Record<Status, string> = {
  PENDING: "Estamos revisando tu pedido",
  CONFIRMED: "Tu pedido fue confirmado",
  PREPARING: "La cocina está preparando tu pedido",
  READY: "¡Tu pedido está listo!",
  DELIVERED: "Que lo disfrutes",
  CANCELLED: "Tu pedido fue cancelado",
};

export function OrderTracker({
  tableCode,
  orderId,
}: {
  tableCode: string;
  orderId: string;
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => apiFetch<OrderResponse>(`/api/public/orders/${orderId}`),
    refetchInterval: 8000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  // El mesero cerró la cuenta.
  if (error instanceof ApiError && error.status === 401) {
    return <SessionClosed tableCode={tableCode} />;
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-ink-muted">No encontramos ese pedido</p>
        <Link href={`/m/${tableCode}`}>
          <Button variant="secondary">Volver al menú</Button>
        </Link>
      </div>
    );
  }

  const { order } = data;
  const cancelled = order.status === "CANCELLED";
  const finished = order.status === "DELIVERED";
  const currentIndex = STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="min-h-dvh pb-24">
      <header className="bg-surface px-4 py-6 text-center">
        <p className="text-sm text-ink-muted">Pedido</p>
        <p className="text-3xl font-bold tracking-tight">{order.orderNumber}</p>
      </header>

      <div
        className={cn(
          "mx-4 mt-4 flex items-center gap-3 rounded-2xl px-4 py-4",
          cancelled ? "bg-status-cancelled/10" : "bg-brand-50",
        )}
      >
        {cancelled ? (
          <X size={22} className="shrink-0 text-status-cancelled" />
        ) : order.status === "READY" ? (
          <UtensilsCrossed size={22} className="shrink-0 text-brand-600" />
        ) : (
          <Clock size={22} className="shrink-0 text-brand-600" />
        )}

        <div>
          <p
            className={cn(
              "font-medium",
              cancelled ? "text-status-cancelled" : "text-brand-700",
            )}
          >
            {MESSAGES[order.status]}
          </p>
          {cancelled && order.cancelledReason && (
            <p className="mt-0.5 text-sm text-ink-muted">
              {order.cancelledReason}
            </p>
          )}
        </div>
      </div>

      {!cancelled && (
        <ol className="mx-4 mt-6 space-y-1">
          {STEPS.map((step, index) => {
            const done = index < currentIndex || finished;
            const active = index === currentIndex && !finished;

            return (
              <li key={step.status} className="flex items-center gap-3 py-2">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done && "bg-status-ready text-white",
                    active && "bg-brand-600 text-white",
                    !done && !active && "bg-surface-border text-ink-muted",
                  )}
                >
                  {done ? <Check size={14} /> : index + 1}
                </span>

                <span
                  className={cn(
                    "text-sm",
                    active ? "font-semibold" : "text-ink-muted",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="mt-6 bg-surface">
        <h2 className="px-4 pb-1 pt-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Detalle
        </h2>

        <ul className="divide-y divide-surface-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 px-4 py-3">
              <span className="font-medium text-ink-muted">
                {item.quantity}×
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.productName}</p>
                {item.notes && (
                  <p className="text-sm italic text-ink-muted">{item.notes}</p>
                )}
              </div>
              <span className="font-medium">
                {formatMoney(item.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-surface-border px-4 py-4">
          <span className="font-medium">Total</span>
          <span className="text-xl font-semibold">
            {formatMoney(order.totalCents)}
          </span>
        </div>
      </section>

      <div className="mt-6 space-y-2 px-4">
        <Link href={`/m/${tableCode}/cuenta`}>
          <Button variant="secondary" size="lg" className="w-full">
            Ver todos mis pedidos
          </Button>
        </Link>

        <Link href={`/m/${tableCode}`}>
          <Button variant="ghost" size="lg" className="w-full">
            Pedir algo más
          </Button>
        </Link>
      </div>
    </div>
  );
}
