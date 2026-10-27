"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { useUser } from "@/hooks/useUser";

// Часовник, който се обновява всяка секунда.
function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // На сървъра часът е неизвестен, затова го показваме едва в браузъра.
  if (!now) return null;
  return <span className="font-mono text-gray-500">{now.toLocaleTimeString("bg-BG")}</span>;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useUser();

  async function handleLogout() {
    await logout();
    setUser(null);
    router.replace("/login");
  }

  return (
    <header className="bg-white shadow text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center">
            V
          </span>
          Vibecode
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Clock />
          {user ? (
            <>
              <Link href="/tools" className="text-blue-600 hover:underline">
                AI инструменти
              </Link>
              <Link href="/dashboard" className="hover:underline">
                {user.name} <span className="text-gray-500">(ID: {user.id})</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-800 text-white rounded px-3 py-1.5 hover:bg-gray-700"
              >
                Изход
              </button>
            </>
          ) : (
            pathname !== "/login" && (
              <Link
                href="/login"
                className="bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700"
              >
                Вход
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
