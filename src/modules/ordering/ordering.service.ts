import {
  ActorSource,
  OrderStatus,
  PaymentMethod,
  type Prisma,
} from "@/generated/prisma/client";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { orderingRepository } from "./ordering.repository";
import { orderStatusMachine } from "./order-status.machine";
import { pricingService } from "./pricing.service";
import { buildOrderNumber, todayRange } from "./order-number";
import type { CreateOrderInput, ListOrdersQuery } from "./ordering.schema";
import { webhookService } from "@/modules/integration";
import {
  toOrderDTO,
  toKitchenOrderDTO,
  type OrderDTO,
  type KitchenOrderDTO,
} from "./ordering.mapper";

export interface OrderActor {
  source: ActorSource;
  id?: string | undefined;
  name?: string | undefined;
}

interface CreateOrderContext {
  restaurantId: string;
  sessionId: string;
  tableId: string;
  guestTokenId?: string | undefined;
  timezone: string;
  requiresStaffConfirmation: boolean;
}

export const orderingService = {
  async createOrder(
    ctx: CreateOrderContext,
    input: CreateOrderInput,
    actor: OrderActor,
  ): Promise<OrderDTO> {
    const productIds = [...new Set(input.items.map((i) => i.productId))];

    const products = await orderingRepository.findProductsForOrder(
      ctx.restaurantId,
      productIds,
    );

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validar existencia y disponibilidad antes de tocar nada.
    for (const item of input.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BusinessRuleError(
          "PRODUCT_NOT_FOUND",
          `El producto ${item.productId} no existe o no está activo`,
        );
      }

      if (!product.isAvailable) {
        throw new BusinessRuleError(
          "PRODUCT_UNAVAILABLE",
          `"${product.name}" no está disponible en este momento`,
          [{ field: "items", issue: `producto agotado: ${product.id}` }],
        );
      }
    }

    // El precio SIEMPRE sale de la base, nunca del cliente.
    const totals = pricingService.calculate(
      input.items.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          productId: product.id,
          productName: product.name,
          unitPriceCents: product.priceCents,
          quantity: item.quantity,
          notes: item.notes,
        };
      }),
    );

    const initialStatus = ctx.requiresStaffConfirmation
      ? OrderStatus.PENDING
      : OrderStatus.CONFIRMED;

    const order = await prisma.$transaction(async (tx) => {
      const { start, end } = todayRange(ctx.timezone);

      const todayCount = await tx.order.count({
        where: {
          restaurantId: ctx.restaurantId,
          createdAt: { gte: start, lt: end },
        },
      });

      const created = await tx.order.create({
        data: {
          restaurantId: ctx.restaurantId,
          tableId: ctx.tableId,
          sessionId: ctx.sessionId,
          guestTokenId: ctx.guestTokenId ?? null,
          orderNumber: buildOrderNumber(todayCount + 1),
          status: initialStatus,
          subtotalCents: totals.subtotalCents,
          totalCents: totals.totalCents,
          notes: input.notes ?? null,
          items: {
            create: totals.lines.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              unitPriceCents: line.unitPriceCents,
              quantity: line.quantity,
              lineTotalCents: line.lineTotalCents,
              notes: line.notes ?? null,
            })),
          },
        },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          fromStatus: null,
          toStatus: initialStatus,
          source: actor.source,
          actorId: actor.id ?? null,
          actorName: actor.name ?? null,
        },
      });

      await webhookService.enqueue(tx, ctx.restaurantId, "order.created", {
        order: {
          id: created.id,
          orderNumber: created.orderNumber,
          tableId: created.tableId,
          status: created.status,
          totalCents: created.totalCents,
          items: created.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            lineTotalCents: i.lineTotalCents,
          })),
        },
      });

      return created;
    });

    return toOrderDTO(order);
  },

  async listOrders(
    restaurantId: string,
    query: ListOrdersQuery,
  ): Promise<{ orders: OrderDTO[]; total: number }> {
    const { orders, total } = await orderingRepository.listOrders(
      restaurantId,
      query,
    );

    return { orders: orders.map(toOrderDTO), total };
  },

  async getOrder(restaurantId: string, orderId: string): Promise<OrderDTO> {
    const order = await orderingRepository.findOrderById(restaurantId, orderId);
    if (!order) throw new NotFoundError("Pedido");

    return toOrderDTO(order);
  },

  async updateStatus(
    restaurantId: string,
    orderId: string,
    toStatus: OrderStatus,
    actor: OrderActor,
    reason?: string,
  ): Promise<OrderDTO> {
    const order = await orderingRepository.findOrderById(restaurantId, orderId);
    if (!order) throw new NotFoundError("Pedido");

    orderStatusMachine.assertTransition(order.status, toStatus);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus,
          ...(toStatus === OrderStatus.CANCELLED && reason
            ? { cancelledReason: reason }
            : {}),
        },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus,
          source: actor.source,
          actorId: actor.id ?? null,
          actorName: actor.name ?? null,
          reason: reason ?? null,
        },
      });

      await webhookService.enqueue(
        tx,
        restaurantId,
        toStatus === "CANCELLED" ? "order.cancelled" : "order.status_changed",
        {
          order: {
            id: result.id,
            orderNumber: result.orderNumber,
            tableId: result.tableId,
            status: result.status,
            totalCents: result.totalCents,
          },
          previousStatus: order.status,
          currentStatus: toStatus,
          reason: reason ?? null,
        },
      );

      return result;
    });

    return toOrderDTO(updated);
  },

  async cancelOrder(
    restaurantId: string,
    orderId: string,
    reason: string,
    actor: OrderActor,
  ): Promise<OrderDTO> {
    return this.updateStatus(
      restaurantId,
      orderId,
      OrderStatus.CANCELLED,
      actor,
      reason,
    );
  },

  async markPaid(
    restaurantId: string,
    orderId: string,
    paymentMethod: PaymentMethod,
  ): Promise<OrderDTO> {
    const order = await orderingRepository.findOrderById(restaurantId, orderId);
    if (!order) throw new NotFoundError("Pedido");

    if (order.paymentStatus === "PAID") {
      throw new BusinessRuleError(
        "ORDER_ALREADY_PAID",
        "El pedido ya figura como pagado",
      );
    }

    const updated = await orderingRepository.markPaid(
      orderId,
      paymentMethod as Prisma.OrderUpdateInput["paymentMethod"],
    );

    return toOrderDTO(updated);
  },

  /** Pedidos de una sesión de mesa, con el total acumulado. */
  async getSessionOrders(restaurantId: string, sessionId: string) {
    const orders = await orderingRepository.findOrdersBySession(
      restaurantId,
      sessionId,
    );

    const active = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const totalCents = active.reduce((sum, o) => sum + o.totalCents, 0);
    const unpaidCents = active
      .filter((o) => o.paymentStatus === "UNPAID")
      .reduce((sum, o) => sum + o.totalCents, 0);

    return {
      orders: orders.map(toOrderDTO),
      totalCents,
      unpaidCents,
    };
  },

  async getHistory(restaurantId: string, orderId: string) {
    const order = await orderingRepository.findOrderById(restaurantId, orderId);
    if (!order) throw new NotFoundError("Pedido");

    return orderingRepository.findHistory(orderId);
  },

  /** Pedidos no terminales, para el tablero de cocina. */
  async getActiveOrders(restaurantId: string): Promise<KitchenOrderDTO[]> {
    const orders = await orderingRepository.findActiveOrders(restaurantId);
    return orders.map(toKitchenOrderDTO);
  },
};
