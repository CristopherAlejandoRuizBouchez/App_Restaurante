import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { env } from "@/lib/env";
import { catalogService } from "@/modules/catalog";

export const GET = withApiHandler(async ({ requestId }) => {
  const menu = await catalogService.getPublicMenu(env.PUBLIC_API_RESTAURANT_ID);

  return ok({ menu }, requestId);
});
