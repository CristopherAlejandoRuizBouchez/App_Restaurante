import { env } from "@/lib/env";
import { deviceAuthService } from "@/modules/identity";
import { PinLogin } from "@/features/kitchen/PinLogin";

export const dynamic = "force-dynamic";

export default async function KitchenLoginPage() {
  const devices = await deviceAuthService.listDevices(
    env.PUBLIC_API_RESTAURANT_ID,
  );

  return <PinLogin devices={devices} />;
}
