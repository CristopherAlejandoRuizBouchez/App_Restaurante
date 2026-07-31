import { redirect } from "next/navigation";
import { getDeviceToken } from "@/lib/api/device-cookie";
import { getSessionToken } from "@/lib/api/session-cookie";
import { authService, deviceAuthService } from "@/modules/identity";
import { KitchenBoard } from "@/features/kitchen/KitchenBoard";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const deviceToken = await getDeviceToken();
  const userToken = await getSessionToken();

  const actor = deviceToken
    ? await deviceAuthService.resolveActor(deviceToken)
    : userToken
      ? await authService.resolveActor(userToken)
      : null;

  if (!actor) redirect("/cocina/login");

  return <KitchenBoard actorName={actor.name} />;
}
