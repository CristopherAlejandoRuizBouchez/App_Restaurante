"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/utils/api-client";
import { OrderTicket, type KitchenOrder } from "./OrderTicket";

interface ActiveOrdersResponse {
  orders: KitchenOrder[];
  serverTime: string;
}

export function KitchenBoard({ actorName }: { actorName: string }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: () =>
      apiFetch<ActiveOrdersResponse>("/api/internal/orders/active"),
    refetchInterval: 5000,
  });

  const advance = useMutation({
    mutationFn: ({
      orderId,
      toStatus,
    }: {
      orderId: string;
      toStatus: string;
    }) =>
      apiFetch(`/api/internal/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: toStatus }),
      }),
    onMutate: ({ orderId }) => setBusyId(orderId),
    onSettled: () => {
      setBusyId(null);
      void queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });

  const orders = data?.orders ?? [];

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-surface-border bg-surface px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Cocina</h1>
          <p className="text-xs text-ink-muted">
            {actorName} · {orders.length} pedido{orders.length === 1 ? "" : "s"}
          </p>
        </div>

        <RefreshCw
          size={18}
          className={
            isFetching ? "animate-spin text-brand-600" : "text-ink-muted"
          }
        />
      </header>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-ink-muted" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-medium">Todo al día</p>
          <p className="text-sm text-ink-muted">No hay pedidos pendientes</p>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {orders.map((order) => (
            <OrderTicket
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onAdvance={(orderId, toStatus) =>
                advance.mutate({ orderId, toStatus })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
