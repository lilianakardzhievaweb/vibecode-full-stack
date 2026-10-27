"use client";

import { FormEvent, useEffect, useState } from "react";

// NEXT_PUBLIC_API_URL е "http://localhost:8201/api" (от docker-compose).
// /login, /logout и /sanctum/csrf-cookie са в корена на Laravel, затова махаме "/api".
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8201/api";
const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

// Laravel записва CSRF токена в бисквитката XSRF-TOKEN.
// Трябва да го върнем в хедъра X-XSRF-TOKEN при всяка POST заявка.
function getXsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// Обща функция за заявки: credentials "include" изпраща и приема бисквитките (сесията).
function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": getXsrfToken(),
      ...options.headers,
    },
  });
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // При зареждане проверяваме дали вече има активна сесия.
  useEffect(() => {
    apiFetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Взимаме CSRF бисквитка от Sanctum
      await apiFetch("/sanctum/csrf-cookie");

      // 2. Изпращаме имейл и парола
      const loginRes = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => ({}));
        setError(data.message ?? "Грешка при вход.");
        return;
      }

      // 3. Взимаме данните на влезлия потребител
      const userRes = await apiFetch("/api/user");
      setUser(await userRes.json());
      setPassword("");
    } catch {
      setError("Няма връзка с бекенда (http://localhost:8201).");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    await apiFetch("/logout", { method: "POST" });
    setUser(null);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6 text-gray-900">
        {loading ? (
          <p className="text-center text-gray-500">Зареждане...</p>
        ) : user ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Здравей, {user.name}!</h1>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Име</dt>
                <dd>{user.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Имейл</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Роля</dt>
                <dd className="font-mono bg-blue-100 text-blue-800 px-2 rounded">
                  {user.role}
                </dd>
              </div>
            </dl>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-800 text-white rounded py-2 hover:bg-gray-700"
            >
              Изход
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
            >
              Влез
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
