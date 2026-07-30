import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { setSessionCookie } from "@/lib/api/session-cookie";
import { authService, loginSchema } from "@/modules/identity";

export const POST = withApiHandler(async ({ req, requestId }) => {
  const body = loginSchema.parse(await req.json());

  const result = await authService.login({
    email: body.email,
    password: body.password,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  await setSessionCookie(result.token, result.expiresAt);

  return ok({ actor: result.actor }, requestId);
});
