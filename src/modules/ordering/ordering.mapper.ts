import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/client";

export interface OrderItemDTO {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  notes: string | null;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  tableId: string;
  sessionId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
}

type OrderWithItems = Order & { items: OrderItem[] };

export function toOrderItemDTO(i: OrderItem): OrderItemDTO {
  return {
    id: i.id,
    productId: i.productId,
    productName: i.productName,
    unitPriceCents: i.unitPriceCents,
    quantity: i.quantity,
    lineTotalCents: i.lineTotalCents,
    notes: i.notes,
  };
}

export function toOrderDTO(o: OrderWithItems): OrderDTO {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    tableId: o.tableId,
    sessionId: o.sessionId,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    subtotalCents: o.subtotalCents,
    totalCents: o.totalCents,
    notes: o.notes,
    cancelledReason: o.cancelledReason,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map(toOrderItemDTO),
  };
}

export interface KitchenOrderDTO extends OrderDTO {
  tableLabel: string;
}

export function toKitchenOrderDTO(
  o: OrderWithItems & { table: { label: string } },
): KitchenOrderDTO {
  return { ...toOrderDTO(o), tableLabel: o.table.label };
}
