"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { roleLabel } from "@/lib/roles";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/context/ToastContext";

// Тестовите акаунти от DatabaseSeeder (парола: password) - за бърз вход при демонстрация
const DEMO_ACCOUNTS = ["owner", "backend", "frontend", "pm", "qa", "designer"];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useUser();
  const toast = useToast();

  const [step, setStep] = useState<"credentials" | "two-factor">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Къде да отидем след вход (напр. /login?next=/admin)
  const next = searchParams.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // Ако вече има активна сесия, директно напред.
  useEffect(() => {
    if (user) router.replace(target);
  }, [user, router, target]);

  async function finishLogin() {
    const u = await refresh();
    toast.success(`Добре дошли, ${u?.name ?? ""}!`);
    router.push(target);
  }

  // Стъпка 1: имейл и парола
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Взимаме CSRF бисквитка от Sanctum
      await apiFetch("/sanctum/csrf-cookie");

      // 2. Изпращаме имейл и парола
      const res = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.errors?.email?.[0] ?? data.message ?? "Грешка при вход.");
        return;
      }

      // 3. При включена 2FA Laravel иска и код от Google Authenticator
      if (data.two_factor) {
        setStep("two-factor");
        return;
      }

      await finishLogin();
    } catch {
      setError("Няма връзка с бекенда (http://localhost:8201).");
    } finally {
      setLoading(false);
    }
  }

  // Стъпка 2: 6-цифрен код или резервен код
  async function handleTwoFactor(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/two-factor-challenge", {
        method: "POST",
        body: JSON.stringify(useRecovery ? { recovery_code: code } : { code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.errors?.code?.[0] ?? data.errors?.recovery_code?.[0] ?? data.message ?? "Невалиден код.");
        return;
      }

      await finishLogin();
    } catch {
      setError("Няма връзка с бекенда (http://localhost:8201).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page flex flex-col items-center gap-6 sm:pt-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {step === "credentials" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Вход</h1>
              <p className="mt-1 text-sm text-slate-600">Влезте с вашия служебен акаунт.</p>
            </div>
            <div>
              <label htmlFor="email" className="label">
                Имейл
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="owner@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Парола
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Влизане..." : "Влез"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTwoFactor} className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Двуфакторна защита</h1>
              <p className="mt-1 text-sm text-slate-600">
                {useRecovery
                  ? "Въведете един от резервните кодове, които запазихте при включването на 2FA."
                  : "Отворете Google Authenticator и въведете 6-цифрения код за AI Tools Hub."}
              </p>
            </div>
            <div>
              <label htmlFor="code" className="label">
                {useRecovery ? "Резервен код" : "Код за потвърждение"}
              </label>
              <input
                id="code"
                required
                autoFocus
                autoComplete="one-time-code"
                inputMode={useRecovery ? "text" : "numeric"}
                pattern={useRecovery ? undefined : "[0-9 ]{6,7}"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input text-center font-mono text-lg! tracking-widest"
                placeholder={useRecovery ? "xxxxx-xxxxx" : "123456"}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Проверка..." : "Потвърди"}
            </button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                className="text-indigo-700 hover:underline"
                onClick={() => {
                  setUseRecovery(!useRecovery);
                  setCode("");
                  setError("");
                }}
              >
                {useRecovery ? "Използвай код от приложението" : "Използвай резервен код"}
              </button>
              <button
                type="button"
                className="text-slate-600 hover:underline"
                onClick={() => {
                  setStep("credentials");
                  setCode("");
                  setError("");
                }}
              >
                Назад
              </button>
            </div>
          </form>
        )}
      </div>

      {step === "credentials" && (
        <section aria-labelledby="demo-title" className="w-full max-w-sm rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4">
          <h2 id="demo-title" className="text-sm font-medium text-slate-900">
            Тестови акаунти
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Паролата на всички е <code className="rounded bg-slate-100 px-1 font-mono">password</code>. Натиснете, за да попълните формата.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setEmail(`${role}@example.com`);
                  setPassword("password");
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left text-xs hover:border-indigo-300 hover:bg-indigo-50"
              >
                <span className="block font-medium text-slate-900">{role}@example.com</span>
                <span className="text-slate-500">{roleLabel(role)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// useSearchParams изисква Suspense в Next.js
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
