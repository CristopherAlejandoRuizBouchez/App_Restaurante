import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deviceAuthService } from "@/modules/identity";
import { PinLogin } from "@/features/kitchen/PinLogin";

export const dynamic = "force-dynamic";

export default async function KitchenLoginPage({
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

  const devices = await deviceAuthService.listDevices(restaurant.id);

  return (
    <PinLogin devices={devices} slug={slug} restaurantName={restaurant.name} />
  );
}
