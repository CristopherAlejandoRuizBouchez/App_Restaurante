import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env["DIRECT_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

const rl = createInterface({ input: process.stdin, output: process.stdout });

/** Convierte "Pizzería Luigi" en "pizzeria-luigi" */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tableCode(): string {
  return randomBytes(5).toString("hex");
}

async function ask(question: string, fallback = ""): Promise<string> {
  const answer = (await rl.question(question)).trim();
  return answer || fallback;
}

async function main() {
  console.log("\n=== ALTA DE RESTAURANTE ===\n");

  const name = await ask("Nombre del restaurante: ");
  if (!name) throw new Error("El nombre es obligatorio");

  const suggestedSlug = toSlug(name);
  const slug = await ask(
    `Identificador en la URL [${suggestedSlug}]: `,
    suggestedSlug,
  );

  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (existing) {
    throw new Error(`Ya existe un restaurante con el identificador "${slug}"`);
  }

  const ownerName = await ask("Nombre del dueño: ");
  const email = (await ask("Correo del dueño: ")).toLowerCase();
  if (!email.includes("@")) throw new Error("Correo inválido");

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken) throw new Error(`Ya existe un usuario con ese correo`);

  const password = await ask("Contraseña (mínimo 8 caracteres): ");
  if (password.length < 8) throw new Error("La contraseña es muy corta");

  const tableCountRaw = await ask("¿Cuántas mesas? [10]: ", "10");
  const tableCount = Math.min(Math.max(Number(tableCountRaw) || 10, 1), 200);

  const pin = await ask("PIN para la tablet de cocina [1234]: ", "1234");
  if (!/^\d{4,8}$/.test(pin)) throw new Error("El PIN debe tener 4-8 dígitos");

  const timezone = await ask(
    "Zona horaria [America/Mexico_City]: ",
    "America/Mexico_City",
  );

  console.log("\nCreando...\n");

  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: { name, slug, timezone, currency: "MXN" },
    });

    const user = await tx.user.create({
      data: {
        name: ownerName,
        email,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        role: Role.OWNER,
      },
    });

    await tx.device.create({
      data: {
        restaurantId: restaurant.id,
        name: "Cocina",
        pinHash: await bcrypt.hash(pin, 12),
        role: Role.KITCHEN,
      },
    });

    await tx.table.createMany({
      data: Array.from({ length: tableCount }, (_, i) => ({
        restaurantId: restaurant.id,
        code: tableCode(),
        label: `Mesa ${i + 1}`,
        seats: 4,
        sortOrder: i,
      })),
    });

    return restaurant;
  });

  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

  console.log("=".repeat(55));
  console.log(`  ${result.name}`);
  console.log("=".repeat(55));
  console.log("");
  console.log("  PANEL DE ADMINISTRACION");
  console.log(`    ${appUrl}/entrar`);
  console.log(`    Usuario:    ${email}`);
  console.log(`    Contrasena: ${password}`);
  console.log("");
  console.log("  TABLET DE COCINA");
  console.log(`    ${appUrl}/cocina/${slug}`);
  console.log(`    PIN: ${pin}`);
  console.log("");
  console.log("  CODIGOS QR");
  console.log(`    ${appUrl}/panel/mesas  ->  boton "Imprimir QR"`);
  console.log(`    ${tableCount} mesas creadas`);
  console.log("");
  console.log("  SIGUIENTE PASO");
  console.log("    Entrar al panel y cargar el menu en la seccion Menu.");
  console.log("");
  console.log("=".repeat(55));
  console.log("");
}

main()
  .catch((e) => {
    console.error("\nERROR:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
