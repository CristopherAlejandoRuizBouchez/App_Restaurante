import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDeviceToken } from "@/lib/api/device-cookie";
import { getSessionToken } from "@/lib/api/session-cookie";
import { authService, deviceAuthService } from "@/modules/identity";
import { KitchenBoard } from "@/features/kitchen/KitchenBoard";

export const dynamic = "force-dynamic";

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!restaurant) notFound();

  const deviceToken = await getDeviceToken();
  const userToken = await getSessionToken();

  const actor = deviceToken
    ? await deviceAuthService.resolveActor(deviceToken)
    : userToken
      ? await authService.resolveActor(userToken)
      : null;

  // La sesión debe pertenecer a ESTE restaurante.
  if (!actor || actor.restaurantId !== restaurant.id) {
    redirect(`/cocina/${slug}/login`);
  }

  return <KitchenBoard actorName={actor.name} />;
}
