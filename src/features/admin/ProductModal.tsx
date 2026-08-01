"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, TextareaField } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/utils/api-client";

export interface ProductData {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
}

export function ProductModal({
  open,
  product,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: ProductData | null;
  categories: Category[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCategoryId(
      product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
    );
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setPrice(product ? (product.priceCents / 100).toFixed(2) : "");
    setImageUrl(product?.imageUrl ?? "");
    setError(null);
  }, [open, product, defaultCategoryId, categories]);

  const save = async () => {
    const priceCents = Math.round(Number(price) * 100);

    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setError("El precio no es válido");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const body = JSON.stringify({
        categoryId,
        name,
        priceCents,
        ...(description ? { description } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      });

      if (product) {
        await apiFetch(`/api/internal/products/${product.id}`, {
          method: "PATCH",
          body,
        });
      } else {
        await apiFetch("/api/internal/products", { method: "POST", body });
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
      title={product ? "Editar producto" : "Nuevo producto"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-surface-border bg-surface-muted px-3 outline-none focus:border-brand-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tacos al pastor"
          maxLength={120}
          autoFocus
        />

        <Field
          label="Precio"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="185.00"
          step="0.01"
          min="0"
        />

        <TextareaField
          label="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Con piña, cilantro y cebolla"
          rows={2}
          maxLength={1000}
        />

        <Field
          label="URL de imagen (opcional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />

        {error && (
          <p className="rounded-xl bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
            {error}
          </p>
        )}

        <button
          onClick={save}
          disabled={busy || !name.trim() || !price || !categoryId}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-medium text-white active:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}
