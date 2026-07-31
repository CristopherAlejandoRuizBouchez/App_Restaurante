import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { setDeviceCookie } from "@/lib/api/device-cookie";
import { env } from "@/lib/env";
import { deviceAuthService, devicePinSchema } from "@/modules/identity";

export const POST = withApiHandler(async ({ req, requestId }) => {
  const body = devicePinSchema.parse(await readJsonBody(req));

  const result = await deviceAuthService.loginWithPin(
    env.PUBLIC_API_RESTAURANT_ID,
    body.deviceId,
    body.pin,
  );

  await setDeviceCookie(result.token, result.expiresAt);

  return ok({ actor: result.actor }, requestId);
});
