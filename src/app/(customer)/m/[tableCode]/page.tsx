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

  const store = await cookies();
  const guestToken = store.get("smq_guest")?.value;

  // Sin cookie válida -> al route handler que la crea.
  if (!guestToken) {
    redirect(`/api/public/enter/${tableCode}`);
  }

  const guest = await tableSessionService.resolveGuest(guestToken);

  if (!guest) {
    redirect(`/api/public/enter/${tableCode}`);
  }

  const [table, menu] = await Promise.all([
    tableSessionService.getTableByCode(restaurantId, tableCode),
    catalogService.getPublicMenu(restaurantId),
  ]);

  return (
    <MenuScreen tableCode={tableCode} tableLabel={table.label} menu={menu} />
  );
}
