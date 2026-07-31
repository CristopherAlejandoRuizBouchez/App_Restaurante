import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { webhookService } from "@/modules/integration";

export const DELETE = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("webhook:manage");
    await webhookService.delete(actor.restaurantId, params.id);

    return ok({ deleted: true }, requestId);
  },
);
