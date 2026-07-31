import { cookies } from "next/headers";
import { AUTH_CONFIG } from "@/config/auth";
import { isProduction } from "@/lib/env";

export async function setDeviceCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const store = await cookies();

  store.set(AUTH_CONFIG.DEVICE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getDeviceToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_CONFIG.DEVICE_COOKIE_NAME)?.value ?? null;
}

export async function clearDeviceCookie(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_CONFIG.DEVICE_COOKIE_NAME);
}
