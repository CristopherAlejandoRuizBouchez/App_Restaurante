import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { catalogService } from "@/modules/catalog";
import { tableSessionService } from "@/modules/ordering";
import { MenuScreen } from "@/features/menu/MenuScreen";

export const dynamic = "force-dynamic";

export default async function TablePage({
  params,
}: {
  params: Promise<{ tableCode: string }>;
}) {
  const { tableCode } = await params;

  const table = await tableSessionService.resolveTableByCode(tableCode);

  const store = await cookies();
  const guestToken = store.get("smq_guest")?.value;

  const guest = guestToken
    ? await tableSessionService.resolveGuest(guestToken)
    : null;

  if (!guest || guest.tableId !== table.id) {
    redirect(`/api/public/enter/${tableCode}`);
  }

  const menu = await catalogService.getPublicMenu(table.restaurantId);

  return (
    <MenuScreen
      tableCode={tableCode}
      tableLabel={table.label}
      restaurantName={table.restaurant.name}
      menu={menu}
    />
  );
}
