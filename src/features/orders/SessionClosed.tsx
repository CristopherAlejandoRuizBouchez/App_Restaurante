"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function SessionClosed({ tableCode }: { tableCode: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <CheckCircle2 size={56} className="text-status-ready" />
      <h1 className="text-2xl font-semibold">Gracias por tu visita</h1>
      <p className="text-ink-muted">Tu cuenta fue cerrada correctamente.</p>
      <Link
        href={`/m/${tableCode}`}
        className="mt-4 rounded-xl border border-surface-border bg-surface px-5 py-3 text-sm font-medium"
      >
        Empezar un pedido nuevo
      </Link>
    </div>
  );
}
