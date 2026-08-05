"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { KlarLogo } from "@/components/brand/KlarLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; user?: { role: string } };
      if (!res.ok || !data.user) {
        setError(data.error ?? "Sign-in failed. Please try again.");
        return;
      }
      const next = searchParams.get("next");
      const fallback = data.user.role === "consultant" ? "/consultant" : "/admin";
      router.push(next && next.startsWith("/") ? next : fallback);
    } catch {
      setError("Sign-in is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <KlarLogo height={36} priority />
        </div>
        <h1 className="mt-6 text-center text-xl font-bold text-brand">Klar team sign-in</h1>
        <form onSubmit={submit} className="card mt-6 space-y-4">
          {error ? (
            <p role="alert" className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-strong">
              {error}
            </p>
          ) : null}
          <div>
            <label htmlFor="login-email" className="field-label">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="field-label">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
