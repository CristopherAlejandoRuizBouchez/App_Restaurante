import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { todayRange } from "../src/modules/ordering/order-number";

const adapter = new PrismaPg({
  connectionString: process.env["DIRECT_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { orderNumber: true, createdAt: true, status: true },
  });

  console.log("\n--- ÚLTIMOS PEDIDOS (UTC) ---");
  orders.forEach((o) =>
    console.log(
      `  ${o.orderNumber}  ${o.createdAt.toISOString()}  ${o.status}`,
    ),
  );

  console.log(`\nTotal en la base: ${await prisma.order.count()}`);

  const range = todayRange("America/Mexico_City");

  console.log("\n--- RANGO DE HOY (México) ---");
  console.log(`  ahora:  ${new Date().toISOString()}`);
  console.log(`  desde:  ${range.start.toISOString()}`);
  console.log(`  hasta:  ${range.end.toISOString()}`);

  const enRango = await prisma.order.count({
    where: { createdAt: { gte: range.start, lt: range.end } },
  });

  console.log(`  pedidos en ese rango: ${enRango}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
