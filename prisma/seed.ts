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
  // ---------- Catálogo demo ----------

  const categoriasDemo = [
    { name: "Entradas", sortOrder: 0 },
    { name: "Platos fuertes", sortOrder: 1 },
    { name: "Bebidas", sortOrder: 2 },
    { name: "Postres", sortOrder: 3 },
  ];

  for (const c of categoriasDemo) {
    await prisma.category.upsert({
      where: {
        restaurantId_name: { restaurantId: restaurant.id, name: c.name },
      },
      update: {},
      create: { ...c, restaurantId: restaurant.id },
    });
  }

  const cats = await prisma.category.findMany({
    where: { restaurantId: restaurant.id },
  });

  const catId = (name: string): string => {
    const found = cats.find((c) => c.name === name);
    if (!found) throw new Error(`Categoría no encontrada: ${name}`);
    return found.id;
  };

  const productosDemo = [
    {
      cat: "Entradas",
      name: "Guacamole con totopos",
      priceCents: 12000,
      sortOrder: 0,
    },
    { cat: "Entradas", name: "Queso fundido", priceCents: 14500, sortOrder: 1 },
    {
      cat: "Platos fuertes",
      name: "Tacos al pastor (5 pz)",
      priceCents: 18500,
      sortOrder: 0,
    },
    {
      cat: "Platos fuertes",
      name: "Enchiladas verdes",
      priceCents: 16500,
      sortOrder: 1,
    },
    {
      cat: "Platos fuertes",
      name: "Chile en nogada",
      priceCents: 28000,
      sortOrder: 2,
    },
    {
      cat: "Bebidas",
      name: "Agua de horchata",
      priceCents: 4500,
      sortOrder: 0,
    },
    { cat: "Bebidas", name: "Refresco", priceCents: 3500, sortOrder: 1 },
    {
      cat: "Bebidas",
      name: "Cerveza artesanal",
      priceCents: 8500,
      sortOrder: 2,
    },
    { cat: "Postres", name: "Flan napolitano", priceCents: 7500, sortOrder: 0 },
    {
      cat: "Postres",
      name: "Churros con cajeta",
      priceCents: 8000,
      sortOrder: 1,
    },
  ];

  const existingProducts = await prisma.product.count({
    where: { restaurantId: restaurant.id },
  });

  if (existingProducts === 0) {
    await prisma.product.createMany({
      data: productosDemo.map((p) => ({
        restaurantId: restaurant.id,
        categoryId: catId(p.cat),
        name: p.name,
        priceCents: p.priceCents,
        sortOrder: p.sortOrder,
      })),
    });
  }

  // ---------- API Key de desarrollo ----------

  const { createHash } = await import("node:crypto");

  const existingKey = await prisma.apiKey.findFirst({
    where: { restaurantId: restaurant.id, name: "Make (desarrollo)" },
  });

  let apiKeyPlain: string | null = null;

  if (!existingKey) {
    apiKeyPlain = "sk_test_" + randomBytes(24).toString("hex");

    await prisma.apiKey.create({
      data: {
        restaurantId: restaurant.id,
        name: "Make (desarrollo)",
        keyHash: createHash("sha256").update(apiKeyPlain).digest("hex"),
        keyPrefix: apiKeyPlain.slice(0, 16),
        scopes: [
          "products:read",
          "products:write",
          "categories:read",
          "tables:read",
          "orders:read",
          "orders:write",
          "webhooks:manage",
        ],
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

  if (apiKeyPlain) {
    console.log(`\nAPI Key (guardala, no se vuelve a mostrar):`);
    console.log(`  ${apiKeyPlain}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
