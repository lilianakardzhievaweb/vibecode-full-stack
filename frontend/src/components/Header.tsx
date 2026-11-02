"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { navForRole, roleLabel } from "@/lib/roles";
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
  return <span className="font-mono text-xs text-slate-500">{now.toLocaleTimeString("bg-BG")}</span>;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  // Затваряме мобилното меню при смяна на страницата
  useEffect(() => setMenuOpen(false), [pathname]);

  async function handleLogout() {
    await logout();
    setUser(null);
    router.replace("/login");
  }

  // Активен е линкът към текущата страница (но /tools не е активен на /tools/new)
  const items = user ? navForRole(user.role) : [];
  const activeHref = items
    .map((i) => i.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      href === activeHref ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Към съдържанието
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-600 to-violet-600 text-sm text-white">
            AI
          </span>
          <span>Tools Hub</span>
        </Link>

        {/* Навигация за десктоп - показва само секциите, достъпни за ролята */}
        {user && (
          <nav aria-label="Основна навигация" className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)} aria-current={item.href === activeHref ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <span className="hidden lg:inline">
            <Clock />
          </span>
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-slate-900">
                  {user.name} <span className="text-xs font-normal text-slate-500">(ID: {user.id})</span>
                </p>
                <p className="text-xs leading-tight text-slate-500">{roleLabel(user.role)}</p>
              </div>
              <button onClick={handleLogout} className="btn-secondary btn-sm hidden md:inline-flex">
                Изход
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? "Затвори менюто" : "Отвори менюто"}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </>
          ) : (
            pathname !== "/login" && (
              <Link href="/login" className="btn-primary btn-sm">
                Вход
              </Link>
            )
          )}
        </div>
      </div>

      {/* Мобилно меню */}
      {user && menuOpen && (
        <nav id="mobile-menu" aria-label="Мобилна навигация" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="mb-3 border-b border-slate-100 pb-3 sm:hidden">
            <p className="text-sm font-medium text-slate-900">
              {user.name} <span className="text-xs text-slate-500">(ID: {user.id})</span>
            </p>
            <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
          </div>
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)} aria-current={item.href === activeHref ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="mt-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50">
              Изход
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
