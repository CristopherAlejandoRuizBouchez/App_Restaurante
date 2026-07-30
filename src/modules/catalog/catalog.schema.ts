import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const createProductSchema = z.object({
  categoryId: z.string().min(1, "La categoría es obligatoria"),
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  description: z.string().max(1000).optional(),
  priceCents: z
    .number()
    .int("El precio debe estar en centavos (entero)")
    .min(0, "El precio no puede ser negativo")
    .max(100_000_000),
  imageUrl: z.string().url("URL de imagen inválida").optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

export const setAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const listProductsQuerySchema = z.object({
  categoryId: z.string().optional(),
  onlyAvailable: z.coerce.boolean().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
