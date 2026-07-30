import type { Category, Product } from "@/generated/prisma/client";

export interface CategoryDTO {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductDTO {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  sortOrder: number;
  isAvailable: boolean;
  isActive: boolean;
}

export interface MenuCategoryDTO extends CategoryDTO {
  products: ProductDTO[];
}

export function toCategoryDTO(c: Category): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
  };
}

export function toProductDTO(p: Product): ProductDTO {
  return {
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    sortOrder: p.sortOrder,
    isAvailable: p.isAvailable,
    isActive: p.isActive,
  };
}
