import { todayRange } from "@/modules/ordering/order-number";
import { reportingRepository } from "./reporting.repository";

export interface SalesSummary {
  from: string;
  to: string;
  orderCount: number;
  cancelledCount: number;
  totalCents: number;
  paidCents: number;
  unpaidCents: number;
  averageTicketCents: number;
  byPaymentMethod: { method: string; count: number; totalCents: number }[];
  byDay: { date: string; orderCount: number; totalCents: number }[];
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    totalCents: number;
  }[];
}

const METHOD_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  CARD_TERMINAL: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

/** Fecha de negocio N días atrás, en la zona del restaurante. */
function businessDaysAgo(timezone: string, days: number): Date {
  const { start } = todayRange(timezone);
  const date = new Date(start);
  date.setDate(date.getDate() - days);
  return date;
}

export const reportingService = {
  async getSalesSummary(
    restaurantId: string,
    timezone: string,
    days = 0,
  ): Promise<SalesSummary> {
    const { start: today } = todayRange(timezone);
    const from = days === 0 ? today : businessDaysAgo(timezone, days);
    const to = today;

    const [orders, items, cancelledCount] = await Promise.all([
      reportingRepository.findOrdersInRange(restaurantId, from, to),
      reportingRepository.findItemsInRange(restaurantId, from, to),
      reportingRepository.countCancelled(restaurantId, from, to),
    ]);

    const totalCents = orders.reduce((sum, o) => sum + o.totalCents, 0);

    const paidCents = orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + o.totalCents, 0);

    // Agrupar por forma de pago (solo lo cobrado)
    const methodMap = new Map<string, { count: number; totalCents: number }>();

    for (const order of orders) {
      if (order.paymentStatus !== "PAID") continue;

      const key = order.paymentMethod ?? "OTHER";
      const current = methodMap.get(key) ?? { count: 0, totalCents: 0 };

      methodMap.set(key, {
        count: current.count + 1,
        totalCents: current.totalCents + order.totalCents,
      });
    }

    // Agrupar por día
    const dayMap = new Map<
      string,
      { orderCount: number; totalCents: number }
    >();

    for (const order of orders) {
      const key = order.businessDate.toISOString().slice(0, 10);
      const current = dayMap.get(key) ?? { orderCount: 0, totalCents: 0 };

      dayMap.set(key, {
        orderCount: current.orderCount + 1,
        totalCents: current.totalCents + order.totalCents,
      });
    }

    // Ranking de productos
    type ProductAgg = {
      productName: string;
      quantity: number;
      totalCents: number;
    };

    const productMap = new Map<string, ProductAgg>();
    for (const item of items) {
      const current = productMap.get(item.productId) ?? {
        productName: item.productName,
        quantity: 0,
        totalCents: 0,
      };

      productMap.set(item.productId, {
        productName: item.productName,
        quantity: current.quantity + item.quantity,
        totalCents: current.totalCents + item.lineTotalCents,
      });
    }

    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      orderCount: orders.length,
      cancelledCount,
      totalCents,
      paidCents,
      unpaidCents: totalCents - paidCents,
      averageTicketCents:
        orders.length > 0 ? Math.round(totalCents / orders.length) : 0,
      byPaymentMethod: [...methodMap.entries()]
        .map(([method, v]) => ({
          method: METHOD_LABEL[method] ?? method,
          ...v,
        }))
        .sort((a, b) => b.totalCents - a.totalCents),
      byDay: [...dayMap.entries()]
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topProducts: [...productMap.entries()]
        .map(([productId, v]) => ({ productId, ...v }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10),
    };
  },
};
