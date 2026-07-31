import { UnauthorizedError } from "@/lib/errors";
import { tableSessionService } from "@/modules/ordering";
import { getGuestToken } from "@/lib/api/guest-cookie";

export interface GuestContext {
  guestTokenId: string;
  sessionId: string;
  restaurantId: string;
  tableId: string;
}

/** Exige un token de comensal válido. Lanza 401 si no hay o expiró. */
export async function requireGuest(): Promise<GuestContext> {
  const token = await getGuestToken();
  if (!token) {
    throw new UnauthorizedError("Escaneá el QR de tu mesa para pedir");
  }

  const guest = await tableSessionService.resolveGuest(token);
  if (!guest) {
    throw new UnauthorizedError(
      "Tu sesión de mesa expiró. Escaneá el QR otra vez",
    );
  }

  return guest;
}
