import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { markPaidSchema, orderingService } from "@/modules/ordering";

export const POST = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const actor = await requirePermission("order:update_status");
    const body = markPaidSchema.parse(await req.json());

    const order = await orderingService.markPaid(
      actor.restaurantId,
      params.id,
      body.paymentMethod,
    );

    return ok({ order }, requestId);
  },
);
