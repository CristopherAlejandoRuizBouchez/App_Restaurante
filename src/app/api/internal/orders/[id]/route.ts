import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { orderingService } from "@/modules/ordering";

export const GET = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("order:read");

    const [order, history] = await Promise.all([
      orderingService.getOrder(actor.restaurantId, params.id),
      orderingService.getHistory(actor.restaurantId, params.id),
    ]);

    return ok({ order, history }, requestId);
  },
);
