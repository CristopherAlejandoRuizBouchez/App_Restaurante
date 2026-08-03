"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import { apiFetch, ApiError } from "@/lib/utils/api-client";
import { cn } from "@/lib/utils/cn";
import { SessionClosed } from "./SessionClosed";
import { CallWaiter } from "./CallWaiter";

type Status =
  "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";

interface SessionOrders {
  orders: {
    id: string;
    orderNumber: string;
    status: Status;
    totalCents: number;
    paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
    createdAt: string;
    items: {
      id: string;
      productName: string;
      quantity: number;
      lineTotalCents: number;
    }[];
  }[];
  totalCents: number;
  unpaidCents: number;
}

const STATUS_LABEL: Record<Status, string> = {
  PENDING: "Sin confirmar",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const STATUS_COLOR: Record<Status, string> = {
  PENDING: "text-status-pending",
  CONFIRMED: "text-status-confirmed",
  PREPARING: "text-status-preparing",
  READY: "text-status-ready",
  DELIVERED: "text-ink-muted",
  CANCELLED: "text-status-cancelled",
};

export function TableBill({ tableCode }: { tableCode: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["session-orders"],
    queryFn: () => apiFetch<SessionOrders>("/api/public/orders"),
    refetchInterval: 10000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  // El mesero cerró la cuenta: la sesión ya no existe.
  if (error instanceof ApiError && error.status === 401) {
    return <SessionClosed tableCode={tableCode} />;
  }

  const orders = data?.orders ?? [];
  const active = orders.filter((o) => o.status !== "CANCELLED");

  return (
    <div className="min-h-dvh pb-48">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-surface-border bg-surface px-4 py-3">
        <Link
          href={`/m/${tableCode}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg active:bg-surface-muted"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold">Mis pedidos</h1>
      </header>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <Receipt size={32} className="text-ink-muted" />
          <p className="text-ink-muted">Todavía no hay pedidos en esta mesa</p>
          <Link href={`/m/${tableCode}`}>
            <Button variant="secondary">Ver el menú</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {active.map((order) => (
            <Link
              key={order.id}
              href={`/m/${tableCode}/orders/${order.id}`}
              className="block overflow-hidden rounded-2xl bg-surface active:bg-surface-muted"
            >
              <header className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      STATUS_COLOR[order.status],
                    )}
                  >
                    {STATUS_LABEL[order.status]}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatMoney(order.totalCents)}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-medium",
                        order.paymentStatus === "PAID"
                          ? "text-status-ready"
                          : "text-ink-muted",
                      )}
                    >
                      {order.paymentStatus === "PAID" ? "Pagado" : "Por pagar"}
                    </p>
                  </div>

                  <ChevronRight size={18} className="text-ink-muted" />
                </div>
              </header>

              <ul className="divide-y divide-surface-border">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-3 px-4 py-2.5 text-sm">
                    <span className="text-ink-muted">{item.quantity}×</span>
                    <span className="min-w-0 flex-1">{item.productName}</span>
                    <span>{formatMoney(item.lineTotalCents)}</span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-surface-border bg-surface p-4">
        {active.length > 0 && (
          <>
            {data && data.unpaidCents !== data.totalCents && (
              <div className="mb-2 flex items-center justify-between text-sm text-ink-muted">
                <span>Total de la mesa</span>
                <span>{formatMoney(data.totalCents)}</span>
              </div>
            )}

            <div className="mb-3 flex items-end justify-between">
              <span className="font-medium">Por pagar</span>
              <span className="text-3xl font-bold">
                {formatMoney(data?.unpaidCents ?? 0)}
              </span>
            </div>
          </>
        )}

        <div className="space-y-2">
          <CallWaiter />

          <Link href={`/m/${tableCode}`}>
            <Button variant="secondary" size="lg" className="w-full">
              Pedir algo más
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
