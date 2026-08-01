import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const BASE =
  "w-full rounded-xl border border-surface-border bg-surface-muted px-3 outline-none focus:border-brand-500";

interface FieldProps {
  label: string;
  error?: string | undefined;
}

export function Field({
  label,
  error,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input className={cn(BASE, "mt-1.5 h-11")} {...props} />
      {error && <p className="mt-1 text-xs text-status-cancelled">{error}</p>}
    </div>
  );
}

export function TextareaField({
  label,
  error,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <textarea className={cn(BASE, "mt-1.5 resize-none py-2.5")} {...props} />
      {error && <p className="mt-1 text-xs text-status-cancelled">{error}</p>}
    </div>
  );
}
