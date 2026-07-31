"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/utils/money";
import { useCart } from "./cart.store";

export function CartBar({ tableCode }: { tableCode: string }) {
  const items = useCart((s) => s.items);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg p-4">
      <Link
        href={`/m/${tableCode}/cart`}
        className="flex h-14 items-center justify-between rounded-2xl bg-brand-600 px-5 text-white shadow-lg active:bg-brand-700"
      >
        <span className="flex items-center gap-2 font-medium">
          <ShoppingBag size={20} />
          {count} {count === 1 ? "producto" : "productos"}
        </span>

        <span className="text-lg font-semibold">{formatMoney(total)}</span>
      </Link>
    </div>
  );
}
