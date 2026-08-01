"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Users,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/utils/api-client";
import { cn } from "@/lib/utils/cn";
import { QrCode } from "@/features/qr/QrCode";
import { downloadQr } from "@/features/qr/download-qr";
import { TableModal, type TableData } from "./TableModal";

export function TablesManager() {
  const qc = useQueryClient();

  const [modal, setModal] = useState<{ open: boolean; data: TableData | null }>(
    {
      open: false,
      data: null,
    },
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const tables = useQuery({
    queryKey: ["admin-tables"],
    queryFn: () => apiFetch<{ tables: TableData[] }>("/api/internal/tables"),
  });

  const refresh = () =>
    void qc.invalidateQueries({ queryKey: ["admin-tables"] });

  const copyUrl = async (code: string) => {
    await navigator.clipboard.writeText(`${origin}/m/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const remove = async (table: TableData) => {
    if (!confirm(`¿Eliminar "${table.label}"?`)) return;

    setNotice(null);

    try {
      await apiFetch(`/api/internal/tables/${table.id}`, { method: "DELETE" });
      refresh();
    } catch (e) {
      setNotice(
        e instanceof ApiError ? e.message : "No se pudo eliminar la mesa",
      );
    }
  };

  if (tables.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  const list = tables.data?.tables ?? [];

  return (
    <div>
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mesas</h1>

        <div className="flex gap-2">
          <Link
            href="/panel/mesas/qr"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 text-sm font-medium"
          >
            <Printer size={16} />
            Imprimir QR
          </Link>

          <button
            onClick={() => setModal({ open: true, data: null })}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white"
          >
            <Plus size={16} />
            Nueva mesa
          </button>
        </div>
      </header>

      {notice && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-status-cancelled/10 px-4 py-3">
          <p className="text-sm text-status-cancelled">{notice}</p>
          <button
            onClick={() => setNotice(null)}
            className="shrink-0 text-sm font-medium text-status-cancelled underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center">
          <p className="font-medium">Todavía no hay mesas</p>
          <p className="mt-1 text-sm text-ink-muted">
            Creá una mesa para generar su código QR.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((table) => (
            <article
              key={table.id}
              className={cn(
                "rounded-2xl bg-surface p-4",
                !table.isActive && "opacity-50",
              )}
            >
              <header className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{table.label}</h2>
                  <p className="flex items-center gap-1 text-sm text-ink-muted">
                    <Users size={14} />
                    {table.seats} personas
                  </p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setModal({ open: true, data: table })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
                    aria-label="Editar"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() => remove(table)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </header>

              <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
                {origin && (
                  <QrCode
                    value={`${origin}/m/${table.code}`}
                    size={64}
                    className="shrink-0 rounded"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <code className="block truncate text-xs text-ink-muted">
                    /m/{table.code}
                  </code>

                  <div className="mt-1.5 flex gap-3">
                    <button
                      onClick={() => copyUrl(table.code)}
                      className="text-xs font-medium text-brand-600"
                    >
                      {copied === table.code ? "Copiado" : "Copiar enlace"}
                    </button>

                    <button
                      onClick={() =>
                        void downloadQr(
                          `${origin}/m/${table.code}`,
                          table.label,
                        )
                      }
                      className="flex items-center gap-1 text-xs font-medium text-brand-600"
                    >
                      <Download size={12} />
                      Descargar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <TableModal
        open={modal.open}
        table={modal.data}
        onClose={() => setModal({ open: false, data: null })}
        onSaved={refresh}
      />
    </div>
  );
}
