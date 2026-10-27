"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Ако вече има активна сесия, директно към таблото.
  useEffect(() => {
    getUser()
      .then((u) => u && router.replace("/dashboard"))
      .catch(() => {});
  }, [router]);

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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Грешка при вход.");
        return;
      }

      // 3. Успешен вход - към таблото (то зарежда /api/user)
      router.push("/dashboard");
    } catch {
      setError("Няма връзка с бекенда (http://localhost:8201).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center p-4 pt-16">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4 text-gray-900"
      >
        <h1 className="text-xl font-semibold">Вход</h1>
        <label className="block text-sm">
          Имейл
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="owner@example.com"
          />
        </label>
        <label className="block text-sm">
          Парола
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Влизане..." : "Влез"}
        </button>
      </form>
    </div>
  );
}
