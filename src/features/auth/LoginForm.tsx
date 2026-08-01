"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/utils/api-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return;

    setBusy(true);
    setError(null);

    try {
      await apiFetch("/api/internal/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      router.push("/panel");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos iniciar sesión");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-muted p-6">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold">SmartMenu</h1>
          <p className="mt-1 text-sm text-ink-muted">Panel de administración</p>
        </header>

        <div className="space-y-4 rounded-2xl bg-surface p-6 shadow-sm">
          <div>
            <label className="text-sm font-medium">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              autoComplete="email"
              className="mt-1.5 h-11 w-full rounded-xl border border-surface-border bg-surface-muted px-3 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              autoComplete="current-password"
              className="mt-1.5 h-11 w-full rounded-xl border border-surface-border bg-surface-muted px-3 outline-none focus:border-brand-500"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={busy || !email || !password}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-medium text-white active:bg-brand-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
