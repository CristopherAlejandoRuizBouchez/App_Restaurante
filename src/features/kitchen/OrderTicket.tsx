"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Status = "PENDING" | "CONFIRMED" | "PREPARING" | "READY";

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableLabel: string;
  status: Status;
  notes: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    notes: string | null;
  }[];
}

const NEXT_ACTION: Record<Status, { label: string; to: string }> = {
  PENDING: { label: "Confirmar", to: "CONFIRMED" },
  CONFIRMED: { label: "Empezar a preparar", to: "PREPARING" },
  PREPARING: { label: "Marcar listo", to: "READY" },
  READY: { label: "Entregado", to: "DELIVERED" },
};

const STATUS_STYLE: Record<Status, string> = {
  PENDING: "border-l-status-pending",
  CONFIRMED: "border-l-status-confirmed",
  PREPARING: "border-l-status-preparing",
  READY: "border-l-status-ready",
};

const STATUS_LABEL: Record<Status, string> = {
  PENDING: "Sin confirmar",
  CONFIRMED: "En espera",
  PREPARING: "Preparando",
  READY: "Listo para entregar",
};

function useElapsed(since: string): number {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const compute = () =>
      setMinutes(Math.floor((Date.now() - new Date(since).getTime()) / 60_000));

    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [since]);

  return minutes;
}

export function OrderTicket({
  order,
  onAdvance,
  busy,
}: {
  order: KitchenOrder;
  onAdvance: (orderId: string, toStatus: string) => void;
  busy: boolean;
}) {
  const elapsed = useElapsed(order.createdAt);
  const action = NEXT_ACTION[order.status];
  const late = elapsed >= 20;

  return (
    <article
      className={cn(
        "rounded-2xl border-l-8 bg-surface p-4 shadow-sm",
        STATUS_STYLE[order.status],
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold leading-none">{order.orderNumber}</p>
          <p className="mt-1 text-sm text-ink-muted">{order.tableLabel}</p>
        </div>

        <div className="text-right">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              late ? "text-status-cancelled" : "text-ink-muted",
            )}
          >
            <Clock size={14} />
            {elapsed} min
          </span>
          <p className="mt-0.5 text-xs text-ink-muted">
            {STATUS_LABEL[order.status]}
          </p>
        </div>
      </header>

      <ul className="mb-3 space-y-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-2.5 text-lg">
            <span className="font-bold text-brand-600">{item.quantity}×</span>
            <div className="min-w-0">
              <span>{item.productName}</span>
              {item.notes && (
                <p className="text-sm font-medium italic text-status-preparing">
                  {item.notes}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mb-3 rounded-xl bg-surface-muted px-3 py-2 text-sm">
          <span className="font-medium">Nota: </span>
          {order.notes}
        </p>
      )}

      <button
        onClick={() => onAdvance(order.id, action.to)}
        disabled={busy}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-lg font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : action.label}
      </button>
    </article>
  );
}
