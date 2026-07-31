import type { NextRequest } from "next/server";
import { ValidationError } from "@/lib/errors";

/** Lee el JSON del request. Cuerpo vacío o inválido -> 400, no 500. */
export async function readJsonBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError("El cuerpo de la petición no es JSON válido");
  }
}
