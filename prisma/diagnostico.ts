import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env["DIRECT_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, slug: true },
  });

  const tables = await prisma.table.findMany({
    orderBy: { sortOrder: "asc" },
    select: { label: true, code: true, restaurantId: true, isActive: true },
  });

  console.log("\n--- RESTAURANTES EN LA BASE ---");
  restaurants.forEach((r) => console.log(`  ${r.id}  ${r.name}`));

  console.log("\n--- LO QUE DICE TU .env ---");
  console.log(`  ${process.env["PUBLIC_API_RESTAURANT_ID"]}`);

  console.log("\n--- MESAS ---");
  tables.forEach((t) =>
    console.log(
      `  ${t.label}  code=${t.code}  activa=${t.isActive}  rest=${t.restaurantId}`,
    ),
  );

  const envId = process.env["PUBLIC_API_RESTAURANT_ID"];
  const match = restaurants.some((r) => r.id === envId);
  console.log(
    `\n>>> ¿El ID del .env existe en la base? ${match ? "SÍ" : "NO"}\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
