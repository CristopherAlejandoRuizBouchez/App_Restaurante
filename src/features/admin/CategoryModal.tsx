"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/utils/api-client";

export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export function CategoryModal({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: CategoryData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setSortOrder(category?.sortOrder ?? 0);
    setError(null);
  }, [open, category]);

  const save = async () => {
    setBusy(true);
    setError(null);

    try {
      const body = JSON.stringify({ name, sortOrder });

      if (category) {
        await apiFetch(`/api/internal/categories/${category.id}`, {
          method: "PATCH",
          body,
        });
      } else {
        await apiFetch("/api/internal/categories", { method: "POST", body });
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
      title={category ? "Editar categoría" : "Nueva categoría"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Entradas, Bebidas..."
          maxLength={80}
          autoFocus
        />

        <Field
          label="Orden"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          min={0}
        />

        {error && (
          <p className="rounded-xl bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
            {error}
          </p>
        )}

        <button
          onClick={save}
          disabled={busy || !name.trim()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-medium text-white active:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}
