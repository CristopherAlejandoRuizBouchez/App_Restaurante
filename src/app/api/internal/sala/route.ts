import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { tableSessionService } from "@/modules/ordering";

export const GET = withApiHandler(async ({ requestId }) => {
  const actor = await requirePermission("order:read");
  const sessions = await tableSessionService.getOpenSessions(
    actor.restaurantId,
  );

  return ok({ sessions }, requestId);
});
