import { withApiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(async ({ requestId }) => {
  await prisma.$queryRaw`SELECT 1`;
  return ok(
    { status: "healthy", timestamp: new Date().toISOString() },
    requestId,
  );
});
