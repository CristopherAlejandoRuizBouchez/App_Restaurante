import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { catalogService, setAvailabilitySchema } from "@/modules/catalog";

export const PATCH = withApiHandler<{ id: string }>(
  async ({ req, params, requestId }) => {
    const actor = await requirePermission("product:availability");
    const body = setAvailabilitySchema.parse(await req.json());

    const product = await catalogService.setAvailability(
      actor.restaurantId,
      params.id,
      body.isAvailable,
    );

    return ok({ product }, requestId);
  },
);
