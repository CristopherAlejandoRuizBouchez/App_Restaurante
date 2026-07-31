import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { NotFoundError } from "@/lib/errors";
import { requireGuest } from "@/lib/api/guest-guard";
import { orderingService } from "@/modules/ordering";

export const GET = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const guest = await requireGuest();
    const order = await orderingService.getOrder(guest.restaurantId, params.id);

    // 404, no 403: un 403 confirmaría que el pedido existe.
    if (order.sessionId !== guest.sessionId) {
      throw new NotFoundError("Pedido");
    }

    return ok({ order }, requestId);
  },
);
