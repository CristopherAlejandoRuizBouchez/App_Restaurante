import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getGuestToken, clearGuestCookie } from "@/lib/api/guest-cookie";
import { tableSessionService } from "@/modules/ordering";

/**
 * Indica si la sesión de mesa sigue abierta.
 * Si se cerró, limpia la cookie para que el próximo escaneo
 * abra una sesión nueva y limpia.
 */
export const GET = withApiHandler(async ({ requestId }) => {
  const token = await getGuestToken();

  if (!token) {
    return ok({ open: false }, requestId);
  }

  const guest = await tableSessionService.resolveGuest(token);

  if (!guest) {
    await clearGuestCookie();
    return ok({ open: false }, requestId);
  }

  return ok({ open: true }, requestId);
});
