import { createHash, randomBytes } from "node:crypto";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { orderingRepository } from "./ordering.repository";

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
};
