import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { setGuestCookie } from "@/lib/api/guest-cookie";
import { env } from "@/lib/env";
import { tableSessionService } from "@/modules/ordering";

export const POST = withApiHandler<{ tableCode: string }>(
  async ({ params, requestId }) => {
    const result = await tableSessionService.openGuestSession(
      env.PUBLIC_API_RESTAURANT_ID,
      params.tableCode,
    );

    await setGuestCookie(result.guestToken, result.expiresAt);

    return ok(
      {
        sessionId: result.sessionId,
        tableId: result.tableId,
        tableLabel: result.tableLabel,
      },
      requestId,
    );
  },
);
