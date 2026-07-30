import type { Role } from "@/generated/prisma/client";

/** Identidad resuelta de quien hace la petición. */
export interface AuthActor {
  kind: "user" | "device";
  id: string;
  name: string;
  restaurantId: string;
  role: Role;
}

export interface SessionResult {
  token: string;
  expiresAt: Date;
  actor: AuthActor;
}
