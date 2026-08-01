"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/utils/api-client";

export interface TableData {
  id: string;
  label: string;
  seats: number;
  code: string;
  isActive: boolean;
}

export function TableModal({
  open,
  table,
  onClose,
  onSaved,
}: {
  open: boolean;
  table: TableData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState("");
  const [seats, setSeats] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel(table?.label ?? "");
    setSeats(table?.seats ?? 4);
    setError(null);
  }, [open, table]);

  const save = async () => {
    setBusy(true);
    setError(null);

    try {
      const body = JSON.stringify({ label, seats });

      if (table) {
        await apiFetch(`/api/internal/tables/${table.id}`, {
          method: "PATCH",
          body,
        });
      } else {
        await apiFetch("/api/internal/tables", { method: "POST", body });
      }

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={table ? "Editar mesa" : "Nueva mesa"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field
          label="Nombre"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Mesa 9, Terraza 2, Barra..."
          maxLength={60}
          autoFocus
        />

        <Field
          label="Capacidad"
          type="number"
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          min={1}
          max={50}
        />

        {error && (
          <p className="rounded-xl bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
            {error}
          </p>
        )}

        <button
          onClick={save}
          disabled={busy || !label.trim()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-medium text-white active:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}
