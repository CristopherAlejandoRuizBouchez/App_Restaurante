import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env["DIRECT_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      memberships: { include: { user: { select: { email: true } } } },
      categories: { select: { name: true } },
      products: { select: { name: true } },
      tables: { select: { code: true, label: true } },
    },
  });

  for (const r of restaurants) {
    console.log("\n" + "=".repeat(50));
    console.log(`${r.name}  (slug: ${r.slug})`);
    console.log(`id: ${r.id}`);
    console.log("=".repeat(50));

    console.log("\n  Usuarios:");
    r.memberships.forEach((m) =>
      console.log(`    ${m.user.email}  [${m.role}]`),
    );

    console.log(`\n  Categorías (${r.categories.length}):`);
    r.categories.forEach((c) => console.log(`    ${c.name}`));

    console.log(`\n  Productos (${r.products.length}):`);
    r.products.forEach((p) => console.log(`    ${p.name}`));

    console.log(`\n  Mesas (${r.tables.length}):`);
    r.tables
      .slice(0, 3)
      .forEach((t) => console.log(`    ${t.label} -> ${t.code}`));
  }

  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
