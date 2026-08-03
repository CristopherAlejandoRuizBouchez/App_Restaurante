"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ban, Loader2, Receipt, TrendingUp, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/utils/api-client";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

interface Summary {
  from: string;
  to: string;
  orderCount: number;
  cancelledCount: number;
  totalCents: number;
  paidCents: number;
  unpaidCents: number;
  averageTicketCents: number;
  byPaymentMethod: { method: string; count: number; totalCents: number }[];
  byDay: { date: string; orderCount: number; totalCents: number }[];
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    totalCents: number;
  }[];
}

const RANGES = [
  { days: 0, label: "Hoy" },
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function SalesReport() {
  const [days, setDays] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["sales-report", days],
    queryFn: () =>
      apiFetch<{ summary: Summary }>(`/api/internal/reportes?days=${days}`),
    refetchInterval: 60000,
  });

  const summary = data?.summary;

  const maxDayTotal = Math.max(
    ...(summary?.byDay.map((d) => d.totalCents) ?? [0]),
    1,
  );

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Ventas</h1>

        <div className="flex gap-1 rounded-xl bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                days === r.days
                  ? "bg-brand-600 text-white"
                  : "text-ink-muted hover:bg-surface-muted",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading || !summary ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-ink-muted" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tarjetas principales */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl bg-surface p-4">
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <TrendingUp size={14} />
                Total vendido
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatMoney(summary.totalCents)}
              </p>
            </article>

            <article className="rounded-2xl bg-surface p-4">
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Wallet size={14} />
                Cobrado
              </p>
              <p className="mt-1 text-2xl font-bold text-status-ready">
                {formatMoney(summary.paidCents)}
              </p>
              {summary.unpaidCents > 0 && (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {formatMoney(summary.unpaidCents)} sin cobrar
                </p>
              )}
            </article>

            <article className="rounded-2xl bg-surface p-4">
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Receipt size={14} />
                Pedidos
              </p>
              <p className="mt-1 text-2xl font-bold">{summary.orderCount}</p>
              {summary.cancelledCount > 0 && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                  <Ban size={11} />
                  {summary.cancelledCount} cancelado
                  {summary.cancelledCount === 1 ? "" : "s"}
                </p>
              )}
            </article>

            <article className="rounded-2xl bg-surface p-4">
              <p className="text-sm text-ink-muted">Ticket promedio</p>
              <p className="mt-1 text-2xl font-bold">
                {formatMoney(summary.averageTicketCents)}
              </p>
            </article>
          </div>

          {/* Formas de pago */}
          {summary.byPaymentMethod.length > 0 && (
            <section className="rounded-2xl bg-surface p-4">
              <h2 className="mb-3 font-semibold">Formas de pago</h2>

              <ul className="space-y-2">
                {summary.byPaymentMethod.map((m) => (
                  <li
                    key={m.method}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {m.method}
                      <span className="ml-2 text-ink-muted">
                        {m.count} pedido{m.count === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="font-semibold">
                      {formatMoney(m.totalCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Ventas por día */}
          {days > 0 && summary.byDay.length > 1 && (
            <section className="rounded-2xl bg-surface p-4">
              <h2 className="mb-3 font-semibold">Ventas por día</h2>

              <ul className="space-y-2">
                {summary.byDay.map((d) => (
                  <li key={d.date} className="flex items-center gap-3">
                    <span className="w-12 shrink-0 text-xs text-ink-muted">
                      {formatDate(d.date)}
                    </span>

                    <div className="h-6 flex-1 overflow-hidden rounded-md bg-surface-muted">
                      <div
                        className="h-full rounded-md bg-brand-500"
                        style={{
                          width: `${(d.totalCents / maxDayTotal) * 100}%`,
                        }}
                      />
                    </div>

                    <span className="w-24 shrink-0 text-right text-sm font-medium">
                      {formatMoney(d.totalCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Productos más vendidos */}
          <section className="rounded-2xl bg-surface p-4">
            <h2 className="mb-3 font-semibold">Más vendidos</h2>

            {summary.topProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">
                Todavía no hay ventas en este período
              </p>
            ) : (
              <ol className="space-y-2">
                {summary.topProducts.map((p, index) => (
                  <li
                    key={p.productId}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs font-semibold text-ink-muted">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {p.productName}
                    </span>

                    <span className="shrink-0 text-ink-muted">
                      {p.quantity}×
                    </span>

                    <span className="w-24 shrink-0 text-right font-medium">
                      {formatMoney(p.totalCents)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
