import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/api/session-cookie";
import { authService } from "@/modules/identity";
import { LoginForm } from "@/features/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const token = await getSessionToken();

  if (token) {
    const actor = await authService.resolveActor(token);
    if (actor) redirect("/panel");
  }

  return <LoginForm />;
}
