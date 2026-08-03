import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { waiterCallService } from "@/modules/ordering";

export const POST = withApiHandler<{ id: string }>(
  async ({ params, requestId }) => {
    const actor = await requirePermission("order:update_status");

    await waiterCallService.attend(actor.restaurantId, params.id, actor.name);

    return ok({ attended: true }, requestId);
  },
);
