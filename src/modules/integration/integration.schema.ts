import { z } from "zod";
import { API_SCOPES } from "@/config/scopes";
import { WEBHOOK_EVENTS } from "./events";

export const createApiKeySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80),
  scopes: z.array(z.enum(API_SCOPES)).min(1, "Debe tener al menos un scope"),
});

export const createWebhookSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80),
  url: z.string().url("URL inválida"),
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, "Debe suscribirse a al menos un evento"),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
