"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { apiFetch, ApiError } from "@/lib/utils/api-client";

const REASONS = [
  { value: "BILL", label: "Pedir la cuenta" },
  { value: "ASSISTANCE", label: "Necesito algo" },
  { value: "PROBLEM", label: "Tengo un problema" },
];

interface ActiveCall {
  call: { id: string; reason: string; createdAt: string } | null;
}

export function CallWaiter() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["waiter-call"],
    queryFn: () => apiFetch<ActiveCall>("/api/public/llamar"),
    refetchInterval: 15000,
    retry: false,
  });

  const call = useMutation({
    mutationFn: (reason: string) =>
      apiFetch("/api/public/llamar", {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["waiter-call"] });
    },
    onError: (e) => {
      setError(e instanceof ApiError ? e.message : "No se pudo avisar");
    },
  });

  const pending = data?.call !== null && data?.call !== undefined;

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface font-medium disabled:opacity-60"
      >
        {pending ? (
          <>
            <Check size={18} className="text-status-ready" />
            Ya avisamos al personal
          </>
        ) : (
          <>
            <BellRing size={18} />
            Llamar al mesero
          </>
        )}
      </button>

      <Modal
        open={open}
        title="¿En qué te ayudamos?"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => call.mutate(r.value)}
              disabled={call.isPending}
              className="flex h-14 w-full items-center justify-center rounded-xl border border-surface-border font-medium active:bg-surface-muted disabled:opacity-50"
            >
              {call.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                r.label
              )}
            </button>
          ))}

          {error && (
            <p className="rounded-xl bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
