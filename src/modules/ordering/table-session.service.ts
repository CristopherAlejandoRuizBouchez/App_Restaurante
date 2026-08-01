import { createHash, randomBytes } from "node:crypto";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { orderingRepository } from "./ordering.repository";
import { BusinessRuleError } from "@/lib/errors";
import { OrderStatus, PaymentMethod } from "@/generated/prisma/client";

const GUEST_TOKEN_TTL_HOURS = 12;

function generateGuestToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface GuestSessionResult {
  sessionId: string;
  tableId: string;
  tableLabel: string;
  guestToken: string;
  expiresAt: Date;
}

export const tableSessionService = {
  /**
   * Punto de entrada del QR: resuelve la mesa por su código,
   * abre sesión si no hay una activa, y emite un token de comensal.
   */

  async getTableByCode(restaurantId: string, code: string) {
    const table = await prisma.table.findFirst({
      where: { restaurantId, code, isActive: true, deletedAt: null },
      select: { id: true, label: true, code: true },
    });

    if (!table) throw new NotFoundError("Mesa");

    return table;
  },

  async openGuestSession(
    restaurantId: string,
    tableCode: string,
    nickname?: string,
  ): Promise<GuestSessionResult> {
    const table = await prisma.table.findFirst({
      where: {
        restaurantId,
        code: tableCode,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!table) throw new NotFoundError("Mesa");

    const session =
      (await orderingRepository.findOpenSession(restaurantId, table.id)) ??
      (await orderingRepository.createSession(restaurantId, table.id));

    const token = generateGuestToken();
    const expiresAt = new Date(
      Date.now() + GUEST_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    );

    await orderingRepository.createGuestToken({
      sessionId: session.id,
      tokenHash: hashGuestToken(token),
      expiresAt,
      nickname,
    });

    return {
      sessionId: session.id,
      tableId: table.id,
      tableLabel: table.label,
      guestToken: token,
      expiresAt,
    };
  },

  /** Valida un token de comensal. Devuelve null si no sirve. */
  async resolveGuest(token: string) {
    const guest = await orderingRepository.findGuestTokenByHash(
      hashGuestToken(token),
    );

    if (!guest) return null;
    if (guest.expiresAt < new Date()) return null;
    if (guest.session.status !== "OPEN") return null;

    return {
      guestTokenId: guest.id,
      sessionId: guest.sessionId,
      restaurantId: guest.session.restaurantId,
      tableId: guest.session.tableId,
    };
  },

  /** Devuelve la sesión abierta de la mesa, o abre una nueva. */
  async getOrOpenSession(restaurantId: string, tableId: string) {
    const existing = await orderingRepository.findOpenSession(
      restaurantId,
      tableId,
    );
    if (existing) return existing;

    return orderingRepository.createSession(restaurantId, tableId);
  },

  async closeSession(restaurantId: string, sessionId: string) {
    const session = await orderingRepository.findSessionById(
      restaurantId,
      sessionId,
    );
    if (!session) throw new NotFoundError("Sesión de mesa");

    return orderingRepository.closeSession(sessionId);
  },

  /** Estado de la sala: mesas ocupadas con su consumo. */
  async getOpenSessions(restaurantId: string) {
    const sessions =
      await orderingRepository.findOpenSessionsWithOrders(restaurantId);

    return sessions.map((session) => {
      const active = session.orders.filter(
        (o) => o.status !== OrderStatus.CANCELLED,
      );

      const totalCents = active.reduce((sum, o) => sum + o.totalCents, 0);
      const unpaidCents = active
        .filter((o) => o.paymentStatus === "UNPAID")
        .reduce((sum, o) => sum + o.totalCents, 0);

      const pendingKitchen = active.filter(
        (o) => o.status !== OrderStatus.DELIVERED,
      ).length;

      return {
        sessionId: session.id,
        tableId: session.table.id,
        tableLabel: session.table.label,
        seats: session.table.seats,
        openedAt: session.openedAt.toISOString(),
        orderCount: active.length,
        pendingKitchen,
        totalCents,
        unpaidCents,
        orders: active.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentStatus,
          totalCents: o.totalCents,
          items: o.items.map((i) => ({
            id: i.id,
            productName: i.productName,
            quantity: i.quantity,
            lineTotalCents: i.lineTotalCents,
          })),
        })),
      };
    });
  },

  /**
   * Cobra todo lo pendiente y cierra la mesa.
   * El próximo cliente que escanee abre una sesión limpia.
   */
  async closeAndPay(
    restaurantId: string,
    sessionId: string,
    paymentMethod: PaymentMethod,
  ) {
    const session = await orderingRepository.findSessionById(
      restaurantId,
      sessionId,
    );
    if (!session) throw new NotFoundError("Sesión de mesa");

    const orders = await orderingRepository.findOrdersBySession(
      restaurantId,
      sessionId,
    );

    const active = orders.filter((o) => o.status !== OrderStatus.CANCELLED);

    const inKitchen = active.filter((o) => o.status !== OrderStatus.DELIVERED);

    if (inKitchen.length > 0) {
      throw new BusinessRuleError(
        "SESSION_HAS_PENDING_ORDERS",
        `La mesa tiene ${inKitchen.length} pedido(s) sin entregar. Entregalos o cancelalos antes de cerrar.`,
      );
    }

    await orderingRepository.markSessionOrdersPaid(sessionId, paymentMethod);
    await orderingRepository.closeSession(sessionId);
  },

  /** Cierra la mesa sin cobrar (se fueron sin consumir, o error). */
  async closeWithoutPayment(restaurantId: string, sessionId: string) {
    const session = await orderingRepository.findSessionById(
      restaurantId,
      sessionId,
    );
    if (!session) throw new NotFoundError("Sesión de mesa");

    await orderingRepository.closeSession(sessionId);
  },
};
