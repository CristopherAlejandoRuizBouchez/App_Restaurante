import { ActorSource } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { orderingService, updateOrderStatusSchema } from "@/modules/ordering";

export const PATCH = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const actor = await requirePermission("order:update_status");
    const body = updateOrderStatusSchema.parse(await req.json());

    const order = await orderingService.updateStatus(
      actor.restaurantId,
      params.id,
      body.status,
      {
        source:
          actor.kind === "device" ? ActorSource.DEVICE : ActorSource.STAFF,
        id: actor.id,
        name: actor.name,
      },
      body.reason,
    );

    return ok({ order }, requestId);
  },
);
