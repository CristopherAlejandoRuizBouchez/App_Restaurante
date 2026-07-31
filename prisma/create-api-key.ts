import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env["DIRECT_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const restaurant = await prisma.restaurant.findFirstOrThrow({
    where: { slug: "demo" },
  });

  const key = "sk_test_" + randomBytes(24).toString("hex");

  const created = await prisma.apiKey.create({
    data: {
      restaurantId: restaurant.id,
      name: `Make (${new Date().toISOString().slice(0, 10)})`,
      keyHash: createHash("sha256").update(key).digest("hex"),
      keyPrefix: key.slice(0, 16),
      scopes: [
        "products:read",
        "products:write",
        "categories:read",
        "tables:read",
        "orders:read",
        "orders:write",
        "reports:read",
        "webhooks:manage",
      ],
    },
  });

  console.log("\n=================================================");
  console.log("  API KEY CREADA - copiala ahora, no se repite");
  console.log("=================================================\n");
  console.log(`  ${key}\n`);
  console.log(`  Nombre:  ${created.name}`);
  console.log(`  Scopes:  ${created.scopes.length}`);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
