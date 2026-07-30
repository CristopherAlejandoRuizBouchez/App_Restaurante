import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { tenantService } from "@/modules/tenant";

export const GET = withApiHandler(async ({ requestId }) => {
  const actor = await requirePermission("restaurant:read");
  const restaurant = await tenantService.getRestaurant(actor.restaurantId);

  return ok({ restaurant }, requestId);
});
