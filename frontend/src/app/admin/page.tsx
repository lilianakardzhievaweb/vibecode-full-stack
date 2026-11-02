"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiJson } from "@/lib/api";
import { ActivityLogEntry, AdminUser, Category, Paginated, Role, SimplePaginated, Tool, ToolStatus, STATUS_LABELS } from "@/lib/types";
import { roleLabel, USER_ROLES } from "@/lib/roles";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/context/ToastContext";
import { StatusBadge } from "@/components/Badge";
import Modal from "@/components/Modal";
import { EmptyState, Loading } from "@/components/States";

type Tab = "tools" | "users" | "activity";
type ToolsResponse = Paginated<Tool> & { counts: Record<ToolStatus, number> };

function Pager({ page, lastPage, onChange }: { page: number; lastPage: number; onChange: (p: number) => void }) {
  if (lastPage <= 1) return null;
  return (
    <nav aria-label="Страници" className="flex items-center justify-center gap-3 pt-2">
      <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Предишна
      </button>
      <span className="text-sm text-slate-600">
        {page} / {lastPage}
      </span>
      <button className="btn-secondary btn-sm" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
        Следваща →
      </button>
    </nav>
  );
}

// ---------------- Инструменти: одобрение и отказ ----------------
function ToolsTab() {
  const toast = useToast();
  const [status, setStatus] = useState<ToolStatus | "">("pending");
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [result, setResult] = useState<ToolsResponse | null>(null);
  const [rejecting, setRejecting] = useState<Tool | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    apiJson<Category[]>("/api/categories").then(setCategories).catch(() => {});
    apiJson<Role[]>("/api/roles").then(setRoles).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams({ status, category, role, search, page: String(page) });
    apiJson<ToolsResponse>(`/api/admin/tools?${params}`)
      .then(setResult)
      .catch((e) => toast.error((e as ApiError).firstMessage));
  }, [status, category, role, search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function approve(tool: Tool) {
    try {
      await apiJson(`/api/admin/tools/${tool.id}/approve`, { method: "POST" });
      toast.success(`„${tool.name}“ е одобрен и вече е видим за всички.`);
      load();
    } catch (e) {
      toast.error((e as ApiError).firstMessage);
    }
  }

  async function reject(e: FormEvent) {
    e.preventDefault();
    if (!rejecting) return;
    try {
      await apiJson(`/api/admin/tools/${rejecting.id}/reject`, { method: "POST", body: JSON.stringify({ reason: reason || null }) });
      toast.info(`„${rejecting.name}“ е отказан.`);
      setRejecting(null);
      setReason("");
      load();
    } catch (err) {
      toast.error((err as ApiError).firstMessage);
    }
  }

  const change = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const statusTabs: { value: ToolStatus | ""; label: string }[] = [
    { value: "pending", label: STATUS_LABELS.pending },
    { value: "approved", label: STATUS_LABELS.approved },
    { value: "rejected", label: STATUS_LABELS.rejected },
    { value: "", label: "Всички" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Филтър по статус">
        {statusTabs.map((t) => {
          const count = t.value ? result?.counts?.[t.value] : undefined;
          const active = status === t.value;
          return (
            <button
              key={t.label}
              onClick={() => change((v) => setStatus(v as ToolStatus | ""))(t.value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                active ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              {t.label}
              {count !== undefined && <span className={`ml-1.5 ${active ? "text-indigo-100" : "text-slate-500"}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div>
          <label htmlFor="a-search" className="label">
            Име
          </label>
          <input id="a-search" type="search" className="input" placeholder="Търси..." value={search} onChange={(e) => change(setSearch)(e.target.value)} />
        </div>
        <div>
          <label htmlFor="a-category" className="label">
            Категория
          </label>
          <select id="a-category" className="input" value={category} onChange={(e) => change(setCategory)(e.target.value)}>
            <option value="">Всички</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="a-role" className="label">
            Роля
          </label>
          <select id="a-role" className="input" value={role} onChange={(e) => change(setRole)(e.target.value)}>
            <option value="">Всички</option>
            {roles.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!result ? (
        <Loading />
      ) : result.data.length === 0 ? (
        <EmptyState title={status === "pending" ? "Няма предложения, които чакат одобрение. 🎉" : "Няма инструменти по тези филтри."} />
      ) : (
        <ul className="space-y-3">
          {result.data.map((tool) => (
            <li key={tool.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/tools/${tool.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">
                      {tool.name}
                    </Link>
                    <StatusBadge status={tool.status} />
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{tool.description}</p>
                  <p className="text-xs text-slate-500">
                    {tool.author?.name ?? "неизвестен"} · {new Date(tool.created_at).toLocaleDateString("bg-BG")} · {tool.categories.map((c) => c.name).join(", ")}
                  </p>
                  {tool.status === "rejected" && tool.rejection_reason && <p className="text-xs text-red-700">Причина: {tool.rejection_reason}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {tool.status !== "approved" && (
                    <button onClick={() => approve(tool)} className="btn-success btn-sm">
                      ✓ Одобри
                    </button>
                  )}
                  {tool.status !== "rejected" && (
                    <button onClick={() => setRejecting(tool)} className="btn-secondary btn-sm text-red-700!">
                      ✕ Откажи
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {result && <Pager page={result.meta.current_page} lastPage={result.meta.last_page} onChange={setPage} />}

      <Modal
        open={!!rejecting}
        title={`Отказ: ${rejecting?.name ?? ""}`}
        onClose={() => setRejecting(null)}
        footer={
          <>
            <button type="button" onClick={() => setRejecting(null)} className="btn-secondary">
              Назад
            </button>
            <button type="submit" form="reject-form" className="btn-danger">
              Откажи инструмента
            </button>
          </>
        }
      >
        <form id="reject-form" onSubmit={reject} className="space-y-2">
          <label htmlFor="reason" className="label">
            Причина (вижда я авторът)
          </label>
          <textarea
            id="reason"
            rows={3}
            maxLength={500}
            className="input"
            placeholder="напр. Добавете линк към документацията и примери за употреба."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}

// ---------------- Потребители и роли ----------------
function UsersTab({ currentUserId }: { currentUserId: number }) {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  useEffect(() => {
    apiJson<AdminUser[]>("/api/admin/users").then(setUsers).catch((e) => toast.error((e as ApiError).firstMessage));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeRole(user: AdminUser, role: string) {
    try {
      await apiJson(`/api/admin/users/${user.id}/role`, { method: "PUT", body: JSON.stringify({ role }) });
      setUsers((list) => (list ?? []).map((u) => (u.id === user.id ? { ...u, role } : u)));
      toast.success(`${user.name} вече е ${roleLabel(role)}.`);
    } catch (e) {
      toast.error((e as ApiError).firstMessage);
    }
  }

  if (!users) return <Loading />;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className="px-4 py-3">Потребител</th>
            <th scope="col" className="px-4 py-3">Роля</th>
            <th scope="col" className="px-4 py-3">2FA</th>
            <th scope="col" className="px-4 py-3 text-right">Инструменти</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{u.name}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </td>
              <td className="px-4 py-3">
                <label htmlFor={`role-${u.id}`} className="sr-only">
                  Роля на {u.name}
                </label>
                <select
                  id={`role-${u.id}`}
                  className="input py-1.5!"
                  value={u.role}
                  disabled={u.id === currentUserId}
                  onChange={(e) => changeRole(u, e.target.value)}
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">{u.two_factor_enabled ? <span className="text-emerald-700">✓ Включена</span> : <span className="text-slate-500">—</span>}</td>
              <td className="px-4 py-3 text-right">{u.tools_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Одит лог ----------------
const ACTION_FILTERS = [
  { value: "", label: "Всички действия" },
  { value: "tool", label: "Инструменти" },
  { value: "auth", label: "Вход и изход" },
  { value: "two_factor", label: "2FA" },
  { value: "comment", label: "Коментари" },
  { value: "user", label: "Роли на потребители" },
  { value: "category", label: "Категории" },
  { value: "profile", label: "Профили" },
];

function ActivityTab() {
  const toast = useToast();
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SimplePaginated<ActivityLogEntry> | null>(null);

  useEffect(() => {
    apiJson<SimplePaginated<ActivityLogEntry>>(`/api/admin/activity?${new URLSearchParams({ action, page: String(page) })}`)
      .then(setResult)
      .catch((e) => toast.error((e as ApiError).firstMessage));
  }, [action, page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label htmlFor="log-action" className="label">
          Тип действие
        </label>
        <select
          id="log-action"
          className="input"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          {ACTION_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {!result ? (
        <Loading />
      ) : result.data.length === 0 ? (
        <EmptyState title="Няма записи." />
      ) : (
        <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {result.data.map((log) => (
            <li key={log.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-900">
                  <span className="font-medium">{log.user?.name ?? "Система"}</span> {log.description.charAt(0).toLowerCase() + log.description.slice(1)}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  {log.action}
                  {log.properties?.reason ? ` · причина: ${String(log.properties.reason)}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-xs text-slate-500">
                <time dateTime={log.created_at}>{new Date(log.created_at).toLocaleString("bg-BG")}</time>
                {log.ip_address && ` · ${log.ip_address}`}
              </p>
            </li>
          ))}
        </ol>
      )}
      {result && <Pager page={result.current_page} lastPage={result.last_page} onChange={setPage} />}
    </div>
  );
}

export default function AdminPage() {
  // Само owner. Защитата е и в Laravel (middleware role:owner) - тук само скриваме страницата.
  const { user, allowed } = useUser({ redirectToLogin: true, roles: ["owner"] });
  const [tab, setTab] = useState<Tab>("tools");

  if (!user || !allowed) return <Loading />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "tools", label: "Инструменти" },
    { id: "users", label: "Потребители" },
    { id: "activity", label: "Одит лог" },
  ];

  return (
    <main className="page space-y-6">
      <div>
        <h1 className="page-title">Админ панел</h1>
        <p className="mt-1 text-sm text-slate-600">Одобрение на предложения, роли на потребителите и история на действията.</p>
      </div>

      <div role="tablist" aria-label="Секции" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "tools" && <ToolsTab />}
        {tab === "users" && <UsersTab currentUserId={user.id} />}
        {tab === "activity" && <ActivityTab />}
      </div>
    </main>
  );
}
