"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/api";
import { Paginated, Stats, Tool } from "@/lib/types";
import { ROLE_INTRO, roleLabel } from "@/lib/roles";
import { useUser } from "@/hooks/useUser";
import ToolCard from "@/components/ToolCard";
import { EmptyState, Loading } from "@/components/States";

function StatCard({ label, value, href, highlight }: { label: string; value: number | string; href?: string; highlight?: boolean }) {
  const content = (
    <>
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${highlight ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
    </>
  );
  const classes = "block rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
  return href ? (
    <Link href={href} className={`${classes} transition hover:border-indigo-300 hover:shadow-md`}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

export default function DashboardPage() {
  // Ако няма активна сесия, useUser връща потребителя към /login.
  const { user } = useUser({ redirectToLogin: true });
  const [stats, setStats] = useState<Stats | null>(null);
  const [forRole, setForRole] = useState<Tool[] | null>(null);
  const [latest, setLatest] = useState<Tool[] | null>(null);

  useEffect(() => {
    if (!user) return;
    apiJson<Stats>("/api/stats").then(setStats).catch(() => {});
    // Препоръчани инструменти за ролята на потребителя (owner вижда най-високо оценените)
    const roleQuery = user.role === "owner" ? "sort=rating" : `role=${user.role}&sort=rating`;
    apiJson<Paginated<Tool>>(`/api/tools?${roleQuery}&per_page=3`).then((r) => setForRole(r.data)).catch(() => setForRole([]));
    apiJson<Paginated<Tool>>("/api/tools?per_page=3").then((r) => setLatest(r.data)).catch(() => setLatest([]));
  }, [user]);

  if (!user) return <Loading />;

  return (
    <main className="page space-y-8">
      <section className="rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm text-indigo-100">Табло</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Здравей, {user.name}!</h1>
        <p className="mt-2 max-w-2xl text-indigo-50">{ROLE_INTRO[user.role] ?? "Добре дошли в AI Tools Hub."}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-white/15 px-3 py-1 font-medium">{roleLabel(user.role)}</span>
          {user.two_factor_enabled ? (
            <span className="rounded-full bg-emerald-400/20 px-3 py-1">✓ 2FA е включена</span>
          ) : (
            <Link href="/profile" className="rounded-full bg-amber-300/25 px-3 py-1 hover:bg-amber-300/35">
              ⚠ Включи 2FA за по-сигурен вход →
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Статистики" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Одобрени инструменти" value={stats?.tools_total ?? "—"} href="/tools" />
        <StatCard label="Категории" value={stats?.categories_total ?? "—"} />
        <StatCard label="Моите предложения" value={stats?.my_tools_total ?? "—"} href="/profile#my-tools" />
        {user.role === "owner" ? (
          <StatCard label="Чакат одобрение" value={stats?.pending_total ?? "—"} href="/admin" highlight={!!stats?.pending_total} />
        ) : (
          <StatCard label="Добави инструмент" value="+" href="/tools/new" />
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {user.role === "owner" ? "Най-високо оценени" : `Препоръчани за ${roleLabel(user.role)}`}
          </h2>
          <Link href={user.role === "owner" ? "/tools" : `/tools?role=${user.role}`} className="text-sm font-medium text-indigo-700 hover:underline">
            Виж всички →
          </Link>
        </div>
        {!forRole ? (
          <Loading />
        ) : forRole.length === 0 ? (
          <EmptyState title="Все още няма инструменти за твоята роля.">
            <Link href="/tools/new" className="text-indigo-700 hover:underline">
              Предложи първия
            </Link>
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forRole.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Най-нови</h2>
          {!latest ? (
            <Loading />
          ) : latest.length === 0 ? (
            <EmptyState title="Няма добавени инструменти." />
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
              {latest.map((tool) => (
                <li key={tool.id}>
                  <Link href={`/tools/${tool.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50">
                    <span>
                      <span className="block font-medium text-slate-900">{tool.name}</span>
                      <span className="line-clamp-1 text-sm text-slate-600">{tool.description}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{new Date(tool.created_at).toLocaleDateString("bg-BG")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Популярни категории</h2>
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {(stats?.top_categories ?? []).map((c) => (
              <li key={c.id}>
                <Link href={`/tools?category=${c.slug}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                  <span className="text-slate-700">{c.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-700">{c.tools_count}</span>
                </Link>
              </li>
            ))}
            {stats && stats.top_categories.length === 0 && <li className="text-sm text-slate-500">Няма категории.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
