import { requireScope } from "@/lib/api/auth-api-key";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { tenantService } from "@/modules/tenant";

export const GET = withApiHandler(async ({ req, requestId }) => {
  const { restaurantId } = await requireScope(req, "tables:read");
  const tables = await tenantService.listTables(restaurantId);

  return ok({ tables }, requestId);
});
