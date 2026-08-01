import { TableBill } from "@/features/orders/TableBill";

export default async function BillPage({
  params,
}: {
  params: Promise<{ tableCode: string }>;
}) {
  const { tableCode } = await params;

  return <TableBill tableCode={tableCode} />;
}
