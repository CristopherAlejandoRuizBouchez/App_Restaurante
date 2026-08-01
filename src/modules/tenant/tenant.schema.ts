import { z } from "zod";

export const createTableSchema = z.object({
  label: z.string().min(1, "El nombre es obligatorio").max(60),
  seats: z.number().int().min(1).max(50).default(4),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateTableSchema = createTableSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
