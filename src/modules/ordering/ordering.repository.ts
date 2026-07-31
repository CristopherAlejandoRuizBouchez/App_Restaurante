import { prisma } from "@/lib/prisma";
import {
  OrderStatus,
  SessionStatus,
  type Prisma,
} from "@/generated/prisma/client";
import type { ListOrdersQuery } from "./ordering.schema";

const orderInclude = { items: true } satisfies Prisma.OrderInclude;

export const orderingRepository = {
  // ---------- Sesiones de mesa ----------

  findOpenSession(restaurantId: string, tableId: string) {
    return prisma.tableSession.findFirst({
      where: { restaurantId, tableId, status: SessionStatus.OPEN },
    });
  },

  createSession(restaurantId: string, tableId: string) {
    return prisma.tableSession.create({
      data: { restaurantId, tableId },
    });
  },

  findSessionById(restaurantId: string, sessionId: string) {
    return prisma.tableSession.findFirst({
      where: { id: sessionId, restaurantId },
      include: { table: true },
    });
  },

  closeSession(sessionId: string) {
    return prisma.tableSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.CLOSED, closedAt: new Date() },
    });
  },

  // ---------- Tokens de comensal ----------

  createGuestToken(data: {
    sessionId: string;
    tokenHash: string;
    expiresAt: Date;
    nickname?: string | undefined;
  }) {
    return prisma.guestToken.create({ data });
  },

  findGuestTokenByHash(tokenHash: string) {
    return prisma.guestToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    });
  },

  // ---------- Productos para el snapshot ----------

  findProductsForOrder(restaurantId: string, productIds: string[]) {
    return prisma.product.findMany({
      where: {
        id: { in: productIds },
        restaurantId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        priceCents: true,
        isAvailable: true,
      },
    });
  },

  // ---------- Pedidos ----------

  countOrdersToday(restaurantId: string, start: Date, end: Date) {
    return prisma.order.count({
      where: { restaurantId, createdAt: { gte: start, lt: end } },
    });
  },

  findOrderById(restaurantId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: orderInclude,
    });
  },

  async listOrders(restaurantId: string, query: ListOrdersQuery) {
    const where: Prisma.OrderWhereInput = {
      restaurantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.tableId ? { tableId: query.tableId } : {}),
      ...(query.sessionId ? { sessionId: query.sessionId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.updatedSince
        ? { updatedAt: { gt: new Date(query.updatedSince) } }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  },

  findOrdersBySession(restaurantId: string, sessionId: string) {
    return prisma.order.findMany({
      where: { restaurantId, sessionId },
      include: orderInclude,
      orderBy: { createdAt: "asc" },
    });
  },

  updateOrderStatus(orderId: string, status: OrderStatus, reason?: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === OrderStatus.CANCELLED && reason
          ? { cancelledReason: reason }
          : {}),
      },
      include: orderInclude,
    });
  },

  markPaid(
    orderId: string,
    paymentMethod: Prisma.OrderUpdateInput["paymentMethod"],
  ) {
    return prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", paymentMethod, paidAt: new Date() },
      include: orderInclude,
    });
  },

  findHistory(orderId: string) {
    return prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
  },

  findActiveOrders(restaurantId: string) {
    return prisma.order.findMany({
      where: {
        restaurantId,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ],
        },
      },
      include: { items: true, table: { select: { label: true } } },
      orderBy: { createdAt: "asc" },
    });
  },
};
