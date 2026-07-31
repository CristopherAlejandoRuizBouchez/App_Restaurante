import { OrderTracker } from "@/features/orders/OrderTracker";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ tableCode: string; id: string }>;
}) {
  const { tableCode, id } = await params;

  return <OrderTracker tableCode={tableCode} orderId={id} />;
}
