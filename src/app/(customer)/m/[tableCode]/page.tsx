import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
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
  const restaurantId = env.PUBLIC_API_RESTAURANT_ID;

  const table = await tableSessionService.getTableByCode(
    restaurantId,
    tableCode,
  );

  const store = await cookies();
  const guestToken = store.get("smq_guest")?.value;

  const guest = guestToken
    ? await tableSessionService.resolveGuest(guestToken)
    : null;

  // La cookie debe corresponder a ESTA mesa. Si el comensal cambió de mesa
  // (o quedó una cookie vieja), se abre una sesión nueva.
  if (!guest || guest.tableId !== table.id) {
    redirect(`/api/public/enter/${tableCode}`);
  }

  const menu = await catalogService.getPublicMenu(restaurantId);

  return (
    <MenuScreen tableCode={tableCode} tableLabel={table.label} menu={menu} />
  );
}
