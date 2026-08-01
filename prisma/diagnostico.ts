import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env["DIRECT_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const sessions = await prisma.tableSession.findMany({
    include: {
      table: { select: { label: true } },
      orders: {
        select: { orderNumber: true, totalCents: true, status: true },
      },
    },
    orderBy: { openedAt: "desc" },
    take: 10,
  });

  console.log("\n--- SESIONES ---");
  for (const s of sessions) {
    console.log(
      `\n${s.table.label}  [${s.status}]  abierta ${s.openedAt.toISOString()}`,
    );
    console.log(`  sessionId: ${s.id}`);
    s.orders.forEach((o) =>
      console.log(
        `    ${o.orderNumber}  $${(o.totalCents / 100).toFixed(2)}  ${o.status}`,
      ),
    );
  }

  const tokens = await prisma.guestToken.findMany({
    include: { session: { include: { table: { select: { label: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  console.log("\n\n--- TOKENS DE COMENSAL (más recientes) ---");
  tokens.forEach((t) =>
    console.log(
      `  ${t.createdAt.toISOString()}  ->  ${t.session.table.label}  (sesión ${t.sessionId.slice(-6)})`,
    ),
  );

  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
