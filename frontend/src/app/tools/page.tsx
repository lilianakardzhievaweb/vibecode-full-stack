"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiJson } from "@/lib/api";
import { Category, Paginated, Role, Tag, Tool } from "@/lib/types";
import { useUser } from "@/hooks/useUser";
import ToolCard from "@/components/ToolCard";
import { EmptyState, Loading } from "@/components/States";

function ToolsList() {
  const { user } = useUser({ redirectToLogin: true });
  const searchParams = useSearchParams();

  // Списъци за филтрите
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Избрани филтри (началните стойности идват от адреса, напр. /tools?role=qa)
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [role, setRole] = useState(searchParams.get("role") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [result, setResult] = useState<Paginated<Tool> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiJson<Role[]>("/api/roles").then(setRoles).catch(() => {});
    apiJson<Category[]>("/api/categories").then(setCategories).catch(() => {});
    apiJson<Tag[]>("/api/tags").then(setTags).catch(() => {});
  }, [user]);

  // Зареждаме инструментите при всяка промяна на филтрите.
  // Изчакваме 300 ms, за да не пращаме заявка за всяка буква при търсене.
  // ignore пази от закъснял отговор на стара заявка, който да презапише по-новия.
  useEffect(() => {
    if (!user) return;
    let ignore = false;
    const params = new URLSearchParams({ search, role, category, tag, sort, page: String(page) });
    const timer = setTimeout(() => {
      apiJson<Paginated<Tool>>(`/api/tools?${params}`)
        .then((data) => {
          if (!ignore) {
            setResult(data);
            setError("");
          }
        })
        .catch((e) => !ignore && setError(e.message));
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [user, search, role, category, tag, sort, page]);

  // При смяна на филтър се връщаме на първа страница
  function filter(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setRole("");
    setCategory("");
    setTag("");
    setPage(1);
  }

  const activeFilters = [search, role, category, tag].filter(Boolean).length;

  if (!user) return <Loading />;

  return (
    <main className="page space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">AI инструменти</h1>
          <p className="mt-1 text-sm text-slate-600">Одобрени инструменти, споделени от екипа.</p>
        </div>
        <Link href="/tools/new" className="btn-primary">
          + Добави инструмент
        </Link>
      </div>

      <section aria-label="Филтри" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <label htmlFor="search" className="sr-only">
            Търсене
          </label>
          <input
            id="search"
            type="search"
            className="input"
            placeholder="Търси по име или описание..."
            value={search}
            onChange={(e) => filter(setSearch)(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary shrink-0 md:hidden"
            aria-expanded={showFilters}
            aria-controls="filter-fields"
          >
            Филтри{activeFilters > 0 && ` (${activeFilters})`}
          </button>
        </div>

        {/* На мобилен филтрите се показват при натискане на бутона */}
        <div id="filter-fields" className={`mt-3 grid gap-3 sm:grid-cols-2 md:grid md:grid-cols-4 ${showFilters ? "grid" : "hidden"}`}>
          <div>
            <label htmlFor="f-role" className="label">
              Роля
            </label>
            <select id="f-role" className="input" value={role} onChange={(e) => filter(setRole)(e.target.value)}>
              <option value="">Всички роли</option>
              {roles.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-category" className="label">
              Категория
            </label>
            <select id="f-category" className="input" value={category} onChange={(e) => filter(setCategory)(e.target.value)}>
              <option value="">Всички категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-tag" className="label">
              Таг
            </label>
            <select id="f-tag" className="input" value={tag} onChange={(e) => filter(setTag)(e.target.value)}>
              <option value="">Всички тагове</option>
              {tags.map((t) => (
                <option key={t.id} value={t.slug}>
                  #{t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-sort" className="label">
              Подреди по
            </label>
            <select id="f-sort" className="input" value={sort} onChange={(e) => filter(setSort)(e.target.value)}>
              <option value="latest">Най-нови</option>
              <option value="rating">Най-високо оценени</option>
              <option value="name">Име (А-Я)</option>
            </select>
          </div>
        </div>
      </section>

      {error ? (
        <EmptyState title="Грешка при зареждане">{error}</EmptyState>
      ) : !result ? (
        <Loading />
      ) : result.data.length === 0 ? (
        <EmptyState title="Няма намерени инструменти.">
          {activeFilters > 0 ? (
            <button onClick={clearFilters} className="text-indigo-700 hover:underline">
              Изчисти филтрите
            </button>
          ) : (
            <Link href="/tools/new" className="text-indigo-700 hover:underline">
              Добави първия инструмент
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>Намерени: {result.meta.total}</p>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-indigo-700 hover:underline">
                Изчисти филтрите
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          {result.meta.last_page > 1 && (
            <nav aria-label="Страници" className="flex items-center justify-center gap-4">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary">
                ← Предишна
              </button>
              <span className="text-sm text-slate-600">
                {result.meta.current_page} / {result.meta.last_page}
              </span>
              <button disabled={page >= result.meta.last_page} onClick={() => setPage(page + 1)} className="btn-secondary">
                Следваща →
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

// useSearchParams изисква Suspense в Next.js
export default function ToolsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ToolsList />
    </Suspense>
  );
}
