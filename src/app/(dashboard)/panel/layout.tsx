import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/api/session-cookie";
import { authService } from "@/modules/identity";
import { PanelNav } from "@/components/layout/PanelNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = await getSessionToken();
  const actor = token ? await authService.resolveActor(token) : null;

  if (!actor) redirect("/entrar");

  return (
    <div className="min-h-dvh bg-surface-muted">
      <PanelNav actorName={actor.name} role={actor.role} />
      <main className="mx-auto max-w-5xl p-4 pb-24 md:pb-4 md:pl-64">
        {children}
      </main>
    </div>
  );
}
