import type { ReactNode } from "react";

export default function KitchenLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-surface-muted">{children}</div>;
}
