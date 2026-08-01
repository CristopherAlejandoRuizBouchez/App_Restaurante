"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { apiFetch } from "@/lib/utils/api-client";
import { QrCode } from "./QrCode";

interface Table {
  id: string;
  label: string;
  code: string;
  isActive: boolean;
}

export function QrSheet() {
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tables"],
    queryFn: () => apiFetch<{ tables: Table[] }>("/api/internal/tables"),
  });

  if (isLoading || !origin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  const tables = (data?.tables ?? []).filter((t) => t.isActive);

  return (
    <div>
      <header className="mb-5 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/panel/mesas"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-muted"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Códigos QR</h1>
            <p className="text-sm text-ink-muted">
              {tables.length} mesa{tables.length === 1 ? "" : "s"} · imprimí,
              recortá y pegá
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white"
        >
          <Printer size={16} />
          Imprimir
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 print:gap-0">
        {tables.map((table) => (
          <article
            key={table.id}
            className="flex break-inside-avoid flex-col items-center rounded-2xl border border-surface-border bg-white p-6 text-center print:rounded-none print:border-dashed"
          >
            <p className="mb-1 text-2xl font-bold">{table.label}</p>
            <p className="mb-4 text-sm text-ink-muted">
              Escaneá para ver el menú y pedir
            </p>

            <QrCode value={`${origin}/m/${table.code}`} size={180} />

            <p className="mt-4 text-xs text-ink-muted">
              {origin.replace(/^https?:\/\//, "")}/m/{table.code}
            </p>
          </article>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="rounded-2xl bg-surface p-8 text-center print:hidden">
          <p className="font-medium">No hay mesas activas</p>
        </div>
      )}
    </div>
  );
}
