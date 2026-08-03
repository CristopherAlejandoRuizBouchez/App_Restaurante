"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Clock, Loader2, Receipt, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { apiFetch, ApiError } from "@/lib/utils/api-client";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

interface SessionOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  items: {
    id: string;
    productName: string;
    quantity: number;
    lineTotalCents: number;
  }[];
}

interface OpenSession {
  sessionId: string;
  tableLabel: string;
  seats: number;
  openedAt: string;
  orderCount: number;
  pendingKitchen: number;
  totalCents: number;
  unpaidCents: number;
  orders: SessionOrder[];
}

interface WaiterCall {
  id: string;
  tableLabel: string;
  reasonLabel: string;
  createdAt: string;
}

const METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "CARD_TERMINAL", label: "Tarjeta" },
  { value: "TRANSFER", label: "Transferencia" },
];

function elapsedLabel(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function RoomView() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<OpenSession | null>(null);
  const [method, setMethod] = useState("CASH");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["room-sessions"],
    queryFn: () => apiFetch<{ sessions: OpenSession[] }>("/api/internal/sala"),
    refetchInterval: 10000,
  });

  const calls = useQuery({
    queryKey: ["waiter-calls"],
    queryFn: () => apiFetch<{ calls: WaiterCall[] }>("/api/internal/llamados"),
    refetchInterval: 8000,
  });

  const attend = async (id: string) => {
    await apiFetch(`/api/internal/llamados/${id}/atender`, { method: "POST" });
    void qc.invalidateQueries({ queryKey: ["waiter-calls"] });
  };

  const close = async (skipPayment = false) => {
    if (!selected) return;

    setBusy(true);
    setNotice(null);

    try {
      await apiFetch(`/api/internal/sala/${selected.sessionId}/cerrar`, {
        method: "POST",
        body: JSON.stringify(
          skipPayment ? { skipPayment: true } : { paymentMethod: method },
        ),
      });

      setSelected(null);
      void qc.invalidateQueries({ queryKey: ["room-sessions"] });
      void qc.invalidateQueries({ queryKey: ["waiter-calls"] });
    } catch (e) {
      setNotice(
        e instanceof ApiError ? e.message : "No se pudo cerrar la mesa",
      );
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  const sessions = data?.sessions ?? [];
  const pendingCalls = calls.data?.calls ?? [];

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-semibold">Sala</h1>
        <p className="text-sm text-ink-muted">
          {sessions.length} mesa{sessions.length === 1 ? "" : "s"} ocupada
          {sessions.length === 1 ? "" : "s"}
        </p>
      </header>

      {pendingCalls.length > 0 && (
        <div className="mb-4 space-y-2">
          {pendingCalls.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl bg-status-cancelled/10 px-4 py-3"
            >
              <BellRing
                size={18}
                className="shrink-0 animate-pulse text-status-cancelled"
              />

              <div className="min-w-0 flex-1">
                <p className="font-medium text-status-cancelled">
                  {c.tableLabel}
                </p>
                <p className="text-sm text-ink-muted">
                  {c.reasonLabel} · hace {elapsedLabel(c.createdAt)}
                </p>
              </div>

              <button
                onClick={() => attend(c.id)}
                className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-sm font-medium"
              >
                Atendido
              </button>
            </div>
          ))}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center">
          <p className="font-medium">No hay mesas ocupadas</p>
          <p className="mt-1 text-sm text-ink-muted">
            Las mesas aparecen acá cuando un cliente escanea el QR.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
            const hasCall = pendingCalls.some(
              (c) => c.tableLabel === session.tableLabel,
            );

            return (
              <button
                key={session.sessionId}
                onClick={() => setSelected(session)}
                className={cn(
                  "rounded-2xl bg-surface p-4 text-left transition-shadow hover:shadow-md",
                  hasCall && "ring-2 ring-status-cancelled",
                )}
              >
                <header className="mb-3 flex items-start justify-between">
                  <div>
                    <h2 className="flex items-center gap-1.5 font-semibold">
                      {session.tableLabel}
                      {hasCall && (
                        <BellRing
                          size={14}
                          className="animate-pulse text-status-cancelled"
                        />
                      )}
                    </h2>
                    <p className="flex items-center gap-1 text-xs text-ink-muted">
                      <Clock size={12} />
                      {elapsedLabel(session.openedAt)}
                    </p>
                  </div>

                  {session.pendingKitchen > 0 && (
                    <span className="rounded-full bg-status-preparing/15 px-2 py-0.5 text-xs font-medium text-status-preparing">
                      {session.pendingKitchen} en cocina
                    </span>
                  )}
                </header>

                <div className="flex items-end justify-between">
                  <span className="flex items-center gap-1 text-sm text-ink-muted">
                    <Receipt size={14} />
                    {session.orderCount} pedido
                    {session.orderCount === 1 ? "" : "s"}
                  </span>

                  <span className="text-xl font-bold">
                    {formatMoney(session.unpaidCents)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={selected !== null}
        title={selected ? `Cuenta · ${selected.tableLabel}` : ""}
        onClose={() => {
          setSelected(null);
          setNotice(null);
        }}
      >
        {selected && (
          <div className="space-y-4">
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {selected.orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-surface-border p-3"
                >
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold">{order.orderNumber}</span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        order.paymentStatus === "PAID"
                          ? "text-status-ready"
                          : "text-ink-muted",
                      )}
                    >
                      {order.paymentStatus === "PAID" ? "Pagado" : "Por pagar"}
                    </span>
                  </div>

                  <ul className="space-y-0.5 text-sm">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex gap-2">
                        <span className="text-ink-muted">{item.quantity}×</span>
                        <span className="min-w-0 flex-1">
                          {item.productName}
                        </span>
                        <span>{formatMoney(item.lineTotalCents)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex items-end justify-between border-t border-surface-border pt-3">
              <span className="font-medium">Total a cobrar</span>
              <span className="text-2xl font-bold">
                {formatMoney(selected.unpaidCents)}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium">Forma de pago</label>
              <div className="mt-2 flex gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      "flex-1 rounded-xl border py-2.5 text-sm font-medium",
                      method === m.value
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-surface-border",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {notice && (
              <p className="rounded-xl bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
                {notice}
              </p>
            )}

            <button
              onClick={() => close(false)}
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-medium text-white active:bg-brand-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Cobrar y cerrar mesa"
              )}
            </button>

            <button
              onClick={() => close(true)}
              disabled={busy}
              className="w-full text-center text-sm text-ink-muted underline"
            >
              Cerrar sin cobrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
