import { z } from "zod";
import { OrderStatus, PaymentMethod } from "@/generated/prisma/client";

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, "productId es obligatorio"),
  quantity: z
    .number()
    .int("La cantidad debe ser un entero")
    .min(1, "La cantidad mínima es 1")
    .max(50, "La cantidad máxima por línea es 50"),
  notes: z.string().max(300).optional(),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemInputSchema)
    .min(1, "El pedido debe tener al menos un producto")
    .max(40, "Demasiadas líneas en un solo pedido"),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  reason: z.string().max(300).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, "El motivo es obligatorio").max(300),
});

export const markPaidSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
});

export const listOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  tableId: z.string().optional(),
  sessionId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  updatedSince: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const createOrderApiSchema = createOrderSchema.extend({
  tableId: z.string().min(1, "tableId es obligatorio"),
});

export type CreateOrderApiInput = z.infer<typeof createOrderApiSchema>;
