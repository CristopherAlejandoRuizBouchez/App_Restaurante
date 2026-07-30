import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(1, "La contraseña es obligatoria").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
