"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete, Loader2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/utils/api-client";
import { cn } from "@/lib/utils/cn";

interface Device {
  id: string;
  name: string;
}

const PIN_LENGTH = 4;

export function PinLogin({ devices }: { devices: Device[] }) {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(
    devices.length === 1 ? (devices[0]?.id ?? null) : null,
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (fullPin: string) => {
    if (!deviceId) return;

    setBusy(true);
    setError(null);

    try {
      await apiFetch("/api/internal/auth/device", {
        method: "POST",
        body: JSON.stringify({ deviceId, pin: fullPin }),
      });

      router.push("/cocina");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo entrar");
      setPin("");
      setBusy(false);
    }
  };

  const press = (digit: string) => {
    if (busy || pin.length >= PIN_LENGTH) return;

    const next = pin + digit;
    setPin(next);

    if (next.length === PIN_LENGTH) void submit(next);
  };

  if (devices.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8 text-center">
        <p className="text-ink-muted">
          No hay dispositivos registrados. Pedile al administrador que cree uno.
        </p>
      </div>
    );
  }

  if (!deviceId) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 p-6">
        <h1 className="mb-2 text-center text-xl font-semibold">
          ¿Qué dispositivo sos?
        </h1>

        {devices.map((d) => (
          <button
            key={d.id}
            onClick={() => setDeviceId(d.id)}
            className="rounded-2xl border border-surface-border bg-surface px-5 py-5 text-lg font-medium active:bg-surface-muted"
          >
            {d.name}
          </button>
        ))}
      </div>
    );
  }

  const device = devices.find((d) => d.id === deviceId);

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center p-6">
      <header className="mb-8 text-center">
        <p className="text-sm text-ink-muted">{device?.name}</p>
        <h1 className="mt-1 text-xl font-semibold">Ingresá el PIN</h1>
      </header>

      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-4 rounded-full transition-colors",
              i < pin.length ? "bg-brand-600" : "bg-surface-border",
            )}
          />
        ))}
      </div>

      {error && (
        <p className="mb-4 text-center text-sm text-status-cancelled">
          {error}
        </p>
      )}

      {busy && (
        <div className="mb-4 flex justify-center">
          <Loader2 size={22} className="animate-spin text-ink-muted" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            disabled={busy}
            className="h-16 rounded-2xl bg-surface text-2xl font-medium shadow-sm active:bg-surface-muted disabled:opacity-50"
          >
            {d}
          </button>
        ))}

        <button
          onClick={() => devices.length > 1 && setDeviceId(null)}
          className="h-16 rounded-2xl text-sm text-ink-muted active:bg-surface-muted"
        >
          {devices.length > 1 ? "Cambiar" : ""}
        </button>

        <button
          onClick={() => press("0")}
          disabled={busy}
          className="h-16 rounded-2xl bg-surface text-2xl font-medium shadow-sm active:bg-surface-muted disabled:opacity-50"
        >
          0
        </button>

        <button
          onClick={() => setPin((p) => p.slice(0, -1))}
          disabled={busy || pin.length === 0}
          className="flex h-16 items-center justify-center rounded-2xl text-ink-muted active:bg-surface-muted disabled:opacity-30"
          aria-label="Borrar"
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
}
