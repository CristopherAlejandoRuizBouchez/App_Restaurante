import { ActorSource } from "@/generated/prisma/client";
import { requireScope } from "@/lib/api/auth-api-key";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { orderingService, updateOrderStatusSchema } from "@/modules/ordering";

export const PATCH = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const { restaurantId } = await requireScope(req, "orders:write");
    const body = updateOrderStatusSchema.parse(await req.json());

    const order = await orderingService.updateStatus(
      restaurantId,
      params.id,
      body.status,
      { source: ActorSource.API, name: "Make" },
      body.reason,
    );

    return ok({ order }, requestId);
  },
);
