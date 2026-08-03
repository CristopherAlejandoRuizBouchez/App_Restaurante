import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { waiterCallService } from "@/modules/ordering";

export const GET = withApiHandler(async ({ requestId }) => {
  const actor = await requirePermission("order:read");
  const calls = await waiterCallService.listPending(actor.restaurantId);

  return ok({ calls }, requestId);
});
