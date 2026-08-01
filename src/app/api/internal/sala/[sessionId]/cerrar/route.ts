import { z } from "zod";
import { PaymentMethod } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/api/auth-guard";
import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/read-body";
import { tableSessionService } from "@/modules/ordering";

const bodySchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  skipPayment: z.boolean().optional(),
});

export const POST = withApiHandler<{ sessionId: string }>(
  async ({ req, params, requestId }) => {
    const actor = await requirePermission("order:update_status");
    const body = bodySchema.parse(await readJsonBody(req));

    if (body.skipPayment) {
      await tableSessionService.closeWithoutPayment(
        actor.restaurantId,
        params.sessionId,
      );
    } else {
      await tableSessionService.closeAndPay(
        actor.restaurantId,
        params.sessionId,
        body.paymentMethod ?? PaymentMethod.CASH,
      );
    }

    return ok({ closed: true }, requestId);
  },
);
