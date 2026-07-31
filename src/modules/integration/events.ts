export const WEBHOOK_EVENTS = [
  "order.created",
  "order.status_changed",
  "order.cancelled",
  "order.paid",
  "product.out_of_stock",
  "table.session_closed",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookEvent<T = unknown> {
  id: string;
  type: WebhookEventType;
  createdAt: string;
  apiVersion: "v1";
  restaurantId: string;
  data: T;
}

export function isValidEvent(value: string): value is WebhookEventType {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value);
}
