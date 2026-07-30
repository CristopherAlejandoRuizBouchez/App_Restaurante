import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env["DIRECT_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

/** Código corto y no adivinable para la URL del QR. */
function tableCode(): string {
  return randomBytes(5).toString("hex");
}

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Restaurante Demo",
      timezone: "America/Mexico_City",
      currency: "MXN",
    },
  });

  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.test" },
    update: {},
    create: {
      email: "owner@demo.test",
      name: "Dueno Demo",
      passwordHash,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_restaurantId: {
        userId: owner.id,
        restaurantId: restaurant.id,
      },
    },
    update: {},
    create: {
      userId: owner.id,
      restaurantId: restaurant.id,
      role: Role.OWNER,
    },
  });

  const existingTables = await prisma.table.count({
    where: { restaurantId: restaurant.id },
  });

  if (existingTables === 0) {
    await prisma.table.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({
        restaurantId: restaurant.id,
        code: tableCode(),
        label: `Mesa ${i + 1}`,
        seats: i < 6 ? 4 : 2,
        sortOrder: i,
      })),
    });
  }

  const existingDevice = await prisma.device.findFirst({
    where: { restaurantId: restaurant.id, name: "Cocina" },
  });

  if (!existingDevice) {
    await prisma.device.create({
      data: {
        restaurantId: restaurant.id,
        name: "Cocina",
        pinHash: await bcrypt.hash("1234", 12),
        role: Role.KITCHEN,
      },
    });
  }

  const tables = await prisma.table.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { sortOrder: "asc" },
    select: { label: true, code: true },
  });

  console.log("\nSeed completado\n");
  console.log(`Restaurante: ${restaurant.name} (${restaurant.slug})`);
  console.log(`Usuario:     owner@demo.test / Demo1234!`);
  console.log(`Cocina PIN:  1234`);
  console.log("\nMesas:");
  tables.forEach((t) => console.log(`  ${t.label} -> /m/${t.code}`));
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
