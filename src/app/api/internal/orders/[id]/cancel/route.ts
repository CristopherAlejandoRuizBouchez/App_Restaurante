import { ActorSource } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { cancelOrderSchema, orderingService } from "@/modules/ordering";

export const POST = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const actor = await requirePermission("order:cancel");
    const body = cancelOrderSchema.parse(await req.json());

    const order = await orderingService.cancelOrder(
      actor.restaurantId,
      params.id,
      body.reason,
      { source: ActorSource.STAFF, id: actor.id, name: actor.name },
    );

    return ok({ order }, requestId);
  },
);
