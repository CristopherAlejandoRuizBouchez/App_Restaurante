import { KitchenBoard } from "@/features/kitchen/KitchenBoard";

export const dynamic = "force-dynamic";

export default function PanelHomePage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Pedidos activos</h1>
      <KitchenBoard actorName="Panel" />
    </div>
  );
}
