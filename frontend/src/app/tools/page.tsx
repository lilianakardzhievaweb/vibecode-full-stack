"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Category, Paginated, Role, Tag, Tool } from "@/lib/types";
import { useUser } from "@/hooks/useUser";
import Card from "@/components/Card";
import Badge from "@/components/Badge";

const selectClass = "border rounded px-3 py-2 bg-white";

export default function ToolsPage() {
  const { user } = useUser({ redirectToLogin: true });

  // Списъци за филтрите
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Избрани филтри
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<Paginated<Tool> | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/roles").then((r) => r.json()).then(setRoles);
    apiFetch("/api/categories").then((r) => r.json()).then(setCategories);
    apiFetch("/api/tags").then((r) => r.json()).then(setTags);
  }, [user]);

  // Зареждаме инструментите при всяка промяна на филтрите.
  // Изчакваме 300 ms, за да не пращаме заявка за всяка буква при търсене.
  // ignore пази от закъснял отговор на стара заявка, който да презапише по-новия.
  useEffect(() => {
    if (!user) return;
    let ignore = false;
    const params = new URLSearchParams({ search, role, category, tag, page: String(page) });
    const timer = setTimeout(() => {
      apiFetch(`/api/tools?${params}`)
        .then((r) => r.json())
        .then((data) => {
          if (!ignore) setResult(data);
        });
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [user, search, role, category, tag, page]);

  // При смяна на филтър се връщаме на първа страница
  function filter(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  if (!user) return <p className="text-center text-gray-500 py-16">Зареждане...</p>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-gray-900">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">AI инструменти</h1>
        <Link href="/tools/new" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
          + Добави инструмент
        </Link>
      </div>

      <Card className="grid gap-3 sm:grid-cols-4">
        <input
          className="border rounded px-3 py-2"
          placeholder="Търси по име..."
          value={search}
          onChange={(e) => filter(setSearch)(e.target.value)}
        />
        <select className={selectClass} value={role} onChange={(e) => filter(setRole)(e.target.value)}>
          <option value="">Всички роли</option>
          {roles.map((r) => (
            <option key={r.id} value={r.slug}>{r.name}</option>
          ))}
        </select>
        <select className={selectClass} value={category} onChange={(e) => filter(setCategory)(e.target.value)}>
          <option value="">Всички категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select className={selectClass} value={tag} onChange={(e) => filter(setTag)(e.target.value)}>
          <option value="">Всички тагове</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>#{t.name}</option>
          ))}
        </select>
      </Card>

      {!result ? (
        <p className="text-gray-500">Зареждане...</p>
      ) : result.data.length === 0 ? (
        <p className="text-gray-500">Няма намерени инструменти.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500">Намерени: {result.meta.total}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((tool) => (
              <Card key={tool.id} href={`/tools/${tool.id}`} className="space-y-2">
                {tool.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tool.images[0].url} alt="" className="w-full h-32 object-cover rounded" />
                )}
                <h2 className="font-semibold">{tool.name}</h2>
                <p className="text-sm text-gray-600 line-clamp-2">{tool.description}</p>
                <div className="flex flex-wrap gap-1">
                  {tool.categories.map((c) => (
                    <Badge key={c.id} color="blue">{c.name}</Badge>
                  ))}
                  {tool.roles.map((r) => (
                    <Badge key={r.id} color="green">{r.name}</Badge>
                  ))}
                </div>
                {tool.tags.length > 0 && (
                  <p className="text-xs text-gray-500">{tool.tags.map((t) => `#${t.name}`).join(" ")}</p>
                )}
              </Card>
            ))}
          </div>

          {result.meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="border rounded px-3 py-1 disabled:opacity-40">
                ← Предишна
              </button>
              <span className="text-sm">
                Страница {result.meta.current_page} от {result.meta.last_page}
              </span>
              <button
                disabled={page >= result.meta.last_page}
                onClick={() => setPage(page + 1)}
                className="border rounded px-3 py-1 disabled:opacity-40"
              >
                Следваща →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
