import { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const reportingRepository = {
  /** Pedidos no cancelados dentro del rango de fechas de negocio. */
  findOrdersInRange(restaurantId: string, from: Date, to: Date) {
    return prisma.order.findMany({
      where: {
        restaurantId,
        businessDate: { gte: from, lte: to },
        status: { not: OrderStatus.CANCELLED },
      },
      select: {
        id: true,
        totalCents: true,
        paymentStatus: true,
        paymentMethod: true,
        businessDate: true,
        createdAt: true,
      },
      orderBy: { businessDate: "asc" },
    });
  },

  /** Líneas de pedido del rango, para el ranking de productos. */
  findItemsInRange(restaurantId: string, from: Date, to: Date) {
    return prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          businessDate: { gte: from, lte: to },
          status: { not: OrderStatus.CANCELLED },
        },
      },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        lineTotalCents: true,
      },
    });
  },

  countCancelled(restaurantId: string, from: Date, to: Date) {
    return prisma.order.count({
      where: {
        restaurantId,
        businessDate: { gte: from, lte: to },
        status: OrderStatus.CANCELLED,
      },
    });
  },
};
