import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(1, "La contraseña es obligatoria").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const devicePinSchema = z.object({
  deviceId: z.string().min(1, "Seleccioná un dispositivo"),
  pin: z
    .string()
    .min(4, "El PIN debe tener al menos 4 dígitos")
    .max(8)
    .regex(/^\d+$/, "El PIN solo puede tener números"),
});

export type DevicePinInput = z.infer<typeof devicePinSchema>;
