import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { webhookService } from "@/modules/integration";

export const GET = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("webhook:manage");
    const deliveries = await webhookService.listDeliveries(
      actor.restaurantId,
      params.id,
    );

    return ok({ deliveries }, requestId);
  },
);
