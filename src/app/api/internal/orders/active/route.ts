import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { orderingService } from "@/modules/ordering";

export const GET = withApiHandler(async ({ requestId }) => {
  const actor = await requirePermission("order:read");
  const orders = await orderingService.getActiveOrders(actor.restaurantId);

  return ok({ orders, serverTime: new Date().toISOString() }, requestId);
});
