import { requireApiKey } from "@/lib/api/auth-api-key";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { catalogService } from "@/modules/catalog";

export const GET = withApiHandler(async ({ req, requestId }) => {
  const { restaurantId } = requireApiKey(req);
  const menu = await catalogService.getPublicMenu(restaurantId);

  return ok({ menu }, requestId);
});
