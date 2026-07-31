import { cookies } from "next/headers";
import { isProduction } from "@/lib/env";

const GUEST_COOKIE_NAME = "smq_guest";

export async function setGuestCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const store = await cookies();

  store.set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getGuestToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE_NAME)?.value ?? null;
}

export async function clearGuestCookie(): Promise<void> {
  const store = await cookies();
  store.delete(GUEST_COOKIE_NAME);
}
