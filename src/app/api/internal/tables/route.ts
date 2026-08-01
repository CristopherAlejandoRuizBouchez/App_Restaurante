import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { createTableSchema, tenantService } from "@/modules/tenant";

export const GET = withApiHandler(async ({ requestId }) => {
  const actor = await requirePermission("table:read");
  const tables = await tenantService.listTables(actor.restaurantId);

  return ok({ tables }, requestId);
});

export const POST = withApiHandler(async ({ req, requestId }) => {
  const actor = await requirePermission("table:manage");
  const body = createTableSchema.parse(await readJsonBody(req));

  const table = await tenantService.createTable(actor.restaurantId, body);

  return created({ table }, requestId);
});
