import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { clearSessionCookie, getSessionToken } from "@/lib/api/session-cookie";
import { authService } from "@/modules/identity";

export const POST = withApiHandler(async ({ requestId }) => {
  const token = await getSessionToken();
  if (token) await authService.logout(token);

  await clearSessionCookie();

  return ok({ loggedOut: true }, requestId);
});
