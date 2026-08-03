import { requireGuest } from "@/lib/api/guest-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { catalogService } from "@/modules/catalog";

export const GET = withApiHandler(async ({ requestId }) => {
  const guest = await requireGuest();
  const menu = await catalogService.getPublicMenu(guest.restaurantId);

  return ok({ menu }, requestId);
});
