"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, EyeOff, Eye } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/utils/api-client";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { CategoryModal, type CategoryData } from "./CategoryModal";
import { ProductModal, type ProductData } from "./ProductModal";

interface Category extends CategoryData {
  isActive: boolean;
}

interface Product extends ProductData {
  isAvailable: boolean;
  isActive: boolean;
}

export function MenuManager() {
  const qc = useQueryClient();

  const [categoryModal, setCategoryModal] = useState<{
    open: boolean;
    data: CategoryData | null;
  }>({ open: false, data: null });

  const [productModal, setProductModal] = useState<{
    open: boolean;
    data: ProductData | null;
    categoryId?: string;
  }>({ open: false, data: null });

  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () =>
      apiFetch<{ categories: Category[] }>("/api/internal/categories"),
  });

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => apiFetch<{ products: Product[] }>("/api/internal/products"),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-categories"] });
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const cats = categories.data?.categories ?? [];
  const prods = products.data?.products ?? [];

  const toggleAvailability = async (product: Product) => {
    setBusyId(product.id);
    setNotice(null);

    try {
      await apiFetch(`/api/internal/products/${product.id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      });
      refresh();
    } catch (e) {
      setNotice(
        e instanceof ApiError
          ? e.message
          : "No se pudo cambiar la disponibilidad",
      );
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;

    setBusyId(product.id);
    setNotice(null);

    try {
      await apiFetch(`/api/internal/products/${product.id}`, {
        method: "DELETE",
      });
      refresh();
    } catch (e) {
      setNotice(
        e instanceof ApiError ? e.message : "No se pudo eliminar el producto",
      );
    } finally {
      setBusyId(null);
    }
  };

  const deleteCategory = async (category: Category) => {
    const items = prods.filter((p) => p.categoryId === category.id);

    // Validación en el cliente: evita el viaje al servidor y explica mejor.
    if (items.length > 0) {
      setNotice(
        `No se puede eliminar "${category.name}": tiene ${items.length} producto(s). Movelos a otra categoría o eliminalos primero.`,
      );
      return;
    }

    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;

    setNotice(null);

    try {
      await apiFetch(`/api/internal/categories/${category.id}`, {
        method: "DELETE",
      });
      refresh();
    } catch (e) {
      setNotice(
        e instanceof ApiError ? e.message : "No se pudo eliminar la categoría",
      );
    }
  };

  if (categories.isLoading || products.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <div>
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Menú</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setCategoryModal({ open: true, data: null })}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 text-sm font-medium"
          >
            <Plus size={16} />
            Categoría
          </button>

          <button
            onClick={() => setProductModal({ open: true, data: null })}
            disabled={cats.length === 0}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white disabled:opacity-50"
          >
            <Plus size={16} />
            Producto
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

      {cats.length === 0 && (
        <div className="rounded-2xl bg-surface p-8 text-center">
          <p className="font-medium">Todavía no hay categorías</p>
          <p className="mt-1 text-sm text-ink-muted">
            Creá una categoría para empezar a cargar tu carta.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {cats.map((category) => {
          const items = prods.filter((p) => p.categoryId === category.id);

          return (
            <section
              key={category.id}
              className="overflow-hidden rounded-2xl bg-surface"
            >
              <header className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                <div>
                  <h2 className="font-semibold">{category.name}</h2>
                  <p className="text-xs text-ink-muted">
                    {items.length} producto{items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setProductModal({
                        open: true,
                        data: null,
                        categoryId: category.id,
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-600 hover:bg-brand-50"
                    aria-label="Agregar producto"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() =>
                      setCategoryModal({ open: true, data: category })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
                    aria-label="Editar categoría"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() => deleteCategory(category)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
                    aria-label="Eliminar categoría"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </header>

              {items.length === 0 ? (
                <p className="px-4 py-5 text-center text-sm text-ink-muted">
                  Sin productos
                </p>
              ) : (
                <ul className="divide-y divide-surface-border">
                  {items.map((product) => (
                    <li
                      key={product.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        !product.isAvailable && "opacity-50",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="line-clamp-1 text-sm text-ink-muted">
                            {product.description}
                          </p>
                        )}
                        {!product.isAvailable && (
                          <p className="text-xs font-medium text-status-cancelled">
                            Agotado
                          </p>
                        )}
                      </div>

                      <span className="font-semibold">
                        {formatMoney(product.priceCents)}
                      </span>

                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleAvailability(product)}
                          disabled={busyId === product.id}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted",
                            product.isAvailable
                              ? "text-status-ready"
                              : "text-ink-muted",
                          )}
                          aria-label={
                            product.isAvailable
                              ? "Marcar agotado"
                              : "Marcar disponible"
                          }
                        >
                          {product.isAvailable ? (
                            <Eye size={15} />
                          ) : (
                            <EyeOff size={15} />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            setProductModal({ open: true, data: product })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => deleteProduct(product)}
                          disabled={busyId === product.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <CategoryModal
        open={categoryModal.open}
        category={categoryModal.data}
        onClose={() => setCategoryModal({ open: false, data: null })}
        onSaved={refresh}
      />

      <ProductModal
        open={productModal.open}
        product={productModal.data}
        categories={cats}
        {...(productModal.categoryId
          ? { defaultCategoryId: productModal.categoryId }
          : {})}
        onClose={() => setProductModal({ open: false, data: null })}
        onSaved={refresh}
      />
    </div>
  );
}
