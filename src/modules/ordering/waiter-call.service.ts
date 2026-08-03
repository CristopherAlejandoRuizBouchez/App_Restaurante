import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const WAITER_CALL_REASONS = {
  BILL: "Pedir la cuenta",
  ASSISTANCE: "Necesito algo",
  PROBLEM: "Tengo un problema",
} as const;

export type WaiterCallReason = keyof typeof WAITER_CALL_REASONS;

export function isValidReason(value: string): value is WaiterCallReason {
  return value in WAITER_CALL_REASONS;
}

export const waiterCallService = {
  /** Crea un llamado. Solo uno activo por sesión. */
  async create(
    restaurantId: string,
    sessionId: string,
    tableId: string,
    reason: WaiterCallReason,
  ) {
    const pending = await prisma.waiterCall.findFirst({
      where: { sessionId, status: "PENDING" },
    });

    if (pending) {
      throw new BusinessRuleError(
        "WAITER_ALREADY_CALLED",
        "Ya avisamos al personal. En un momento se acercan a tu mesa.",
      );
    }

    const call = await prisma.waiterCall.create({
      data: { restaurantId, sessionId, tableId, reason },
    });

    return {
      id: call.id,
      reason: call.reason,
      createdAt: call.createdAt.toISOString(),
    };
  },

  /** Llamado activo de una sesión, si existe. */
  async getActiveForSession(sessionId: string) {
    const call = await prisma.waiterCall.findFirst({
      where: { sessionId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (!call) return null;

    return {
      id: call.id,
      reason: call.reason,
      createdAt: call.createdAt.toISOString(),
    };
  },

  /** Llamados pendientes del restaurante, para el panel. */
  async listPending(restaurantId: string) {
    const calls = await prisma.waiterCall.findMany({
      where: { restaurantId, status: "PENDING" },
      include: { table: { select: { label: true } } },
      orderBy: { createdAt: "asc" },
    });

    return calls.map((c) => ({
      id: c.id,
      tableId: c.tableId,
      tableLabel: c.table.label,
      sessionId: c.sessionId,
      reason: c.reason,
      reasonLabel:
        WAITER_CALL_REASONS[c.reason as WaiterCallReason] ?? c.reason,
      createdAt: c.createdAt.toISOString(),
    }));
  },

  async attend(restaurantId: string, callId: string, staffName: string) {
    const call = await prisma.waiterCall.findFirst({
      where: { id: callId, restaurantId, status: "PENDING" },
    });

    if (!call) throw new NotFoundError("Llamado");

    await prisma.waiterCall.update({
      where: { id: callId },
      data: {
        status: "ATTENDED",
        attendedAt: new Date(),
        attendedByName: staffName,
      },
    });
  },
};
