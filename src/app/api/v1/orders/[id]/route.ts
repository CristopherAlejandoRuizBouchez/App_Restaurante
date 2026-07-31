import { requireScope } from "@/lib/api/auth-api-key";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { orderingService } from "@/modules/ordering";

export const GET = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const { restaurantId } = await requireScope(req, "orders:read");
    const order = await orderingService.getOrder(restaurantId, params.id);

    return ok({ order }, requestId);
  },
);
