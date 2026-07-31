import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { clearDeviceCookie, getDeviceToken } from "@/lib/api/device-cookie";
import { deviceAuthService } from "@/modules/identity";

export const POST = withApiHandler(async ({ requestId }) => {
  const token = await getDeviceToken();
  if (token) await deviceAuthService.logout(token);

  await clearDeviceCookie();

  return ok({ loggedOut: true }, requestId);
});
