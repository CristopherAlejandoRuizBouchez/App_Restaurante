import { CartScreen } from "@/features/cart/CartScreen";

export default async function CartPage({
  params,
}: {
  params: Promise<{ tableCode: string }>;
}) {
  const { tableCode } = await params;

  return <CartScreen tableCode={tableCode} />;
}
