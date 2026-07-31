import { OrderStatus } from "@/generated/prisma/client";
import { BusinessRuleError } from "@/lib/errors";

/**
 * Transiciones permitidas. Un estado ausente del mapa es terminal.
 *
 * PENDING -> CONFIRMED -> PREPARING -> READY -> DELIVERED
 *     \__________\___________\__________\__> CANCELLED
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
};

/** Estados en los que el pedido ya no puede modificarse. */
const TERMINAL: readonly OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

export const orderStatusMachine = {
  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return TRANSITIONS[from].includes(to);
  },

  isTerminal(status: OrderStatus): boolean {
    return TERMINAL.includes(status);
  },

  /** Lanza 422 si la transición no es válida. */
  assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (from === to) {
      throw new BusinessRuleError(
        "ORDER_ALREADY_IN_STATUS",
        `El pedido ya está en estado ${to}`,
      );
    }

    if (!this.canTransition(from, to)) {
      throw new BusinessRuleError(
        "ORDER_INVALID_STATUS_TRANSITION",
        `No se puede pasar de ${from} a ${to}`,
        [
          {
            field: "status",
            issue: `transición ${from} -> ${to} no permitida`,
          },
        ],
      );
    }
  },

  /** Estados a los que se puede ir desde el actual. Útil para la UI. */
  nextStates(from: OrderStatus): readonly OrderStatus[] {
    return TRANSITIONS[from];
  },
};
