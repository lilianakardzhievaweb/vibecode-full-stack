"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiJson, User } from "@/lib/api";
import { Paginated, Tool } from "@/lib/types";
import { roleLabel } from "@/lib/roles";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/context/ToastContext";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import QrCode from "@/components/QrCode";
import ToolCard from "@/components/ToolCard";
import { EmptyState, Loading } from "@/components/States";

// Име и смяна на парола
function ProfileForm({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const updated = await apiJson<User>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name,
          current_password: currentPassword || null,
          password: password || null,
          password_confirmation: passwordConfirmation || null,
        }),
      });
      onSaved(updated);
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
      toast.success("Профилът е запазен.");
    } catch (err) {
      setErrors((err as ApiError).errors);
      toast.error((err as ApiError).firstMessage);
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (key: string) => errors[key]?.[0] && <p className="mt-1 text-xs text-red-700">{errors[key][0]}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">
          Име
        </label>
        <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} />
        {fieldError("name")}
      </div>
      <div>
        <label htmlFor="email" className="label">
          Имейл
        </label>
        <input id="email" className="input bg-slate-50! text-slate-500!" value={user.email} disabled />
      </div>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Смяна на парола (по желание)</legend>
        <div>
          <label htmlFor="current_password" className="label">
            Текуща парола
          </label>
          <input id="current_password" type="password" autoComplete="current-password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          {fieldError("current_password")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">
              Нова парола
            </label>
            <input id="password" type="password" autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            {fieldError("password")}
          </div>
          <div>
            <label htmlFor="password_confirmation" className="label">
              Повтори новата парола
            </label>
            <input id="password_confirmation" type="password" autoComplete="new-password" className="input" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
          </div>
        </div>
      </fieldset>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Запазване..." : "Запази"}
      </button>
    </form>
  );
}

// Включване/изключване на 2FA с Google Authenticator
function TwoFactorSection({ user, onChange }: { user: User; onChange: () => Promise<unknown> }) {
  const toast = useToast();
  const [setup, setSetup] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError("");
    try {
      setSetup(await apiJson("/api/two-factor", { method: "POST" }));
    } catch (e) {
      toast.error((e as ApiError).firstMessage);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiJson<{ recovery_codes: string[] }>("/api/two-factor/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setRecoveryCodes(res.recovery_codes);
      setSetup(null);
      setCode("");
      await onChange();
      toast.success("2FA е включена. Запазете резервните кодове!");
    } catch (err) {
      setError((err as ApiError).firstMessage);
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiJson("/api/two-factor", { method: "DELETE", body: JSON.stringify({ password }) });
      setDisableOpen(false);
      setPassword("");
      setRecoveryCodes(null);
      await onChange();
      toast.info("2FA е изключена.");
    } catch (err) {
      setError((err as ApiError).firstMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
            user.two_factor_enabled ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-800 ring-amber-600/20"
          }`}
        >
          {user.two_factor_enabled ? "✓ Включена" : "Изключена"}
        </span>
        <p className="text-sm text-slate-600">
          {user.two_factor_enabled
            ? "При вход ще въвеждате и код от приложението на телефона."
            : "Добавя втора стъпка при вход: код от Google Authenticator, който се сменя на 30 секунди."}
        </p>
      </div>

      {recoveryCodes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Резервни кодове - запазете ги на сигурно място!</p>
          <p className="mt-1 text-xs text-amber-900">Всеки код важи веднъж. С тях влизате, ако загубите телефона си. Няма да ги видите отново.</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
            {recoveryCodes.map((c) => (
              <li key={c} className="rounded bg-white px-2 py-1 text-center text-slate-900">
                {c}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-secondary btn-sm mt-3"
            onClick={() => navigator.clipboard?.writeText(recoveryCodes.join("\n")).then(() => toast.success("Копирано."))}
          >
            Копирай кодовете
          </button>
        </div>
      )}

      {!user.two_factor_enabled && !setup && (
        <button onClick={start} disabled={busy} className="btn-primary">
          Включи 2FA
        </button>
      )}

      {setup && (
        <form onSubmit={confirm} className="grid gap-6 rounded-lg border border-slate-200 p-4 sm:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <QrCode value={setup.otpauth_url} label="QR код за Google Authenticator" />
          </div>
          <div className="space-y-3 text-sm">
            <ol className="ml-5 list-decimal space-y-1 text-slate-700">
              <li>Инсталирайте Google Authenticator (или Microsoft Authenticator, Authy).</li>
              <li>Натиснете „+“ и сканирайте QR кода.</li>
              <li>Въведете 6-цифрения код, който се появи.</li>
            </ol>
            <p className="text-xs text-slate-600">
              Не можете да сканирате? Въведете ключа ръчно:
              <code className="mt-1 block break-all rounded bg-slate-100 px-2 py-1 font-mono text-slate-900">{setup.secret.match(/.{1,4}/g)?.join(" ")}</code>
            </p>
            <div>
              <label htmlFor="tf-code" className="label">
                Код от приложението
              </label>
              <input
                id="tf-code"
                className="input max-w-40 text-center font-mono tracking-widest"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary">
                Потвърди
              </button>
              <button type="button" onClick={() => setSetup(null)} className="btn-secondary">
                Отказ
              </button>
            </div>
          </div>
        </form>
      )}

      {user.two_factor_enabled && (
        <button onClick={() => setDisableOpen(true)} className="btn-secondary">
          Изключи 2FA
        </button>
      )}

      <Modal
        open={disableOpen}
        title="Изключване на 2FA"
        onClose={() => setDisableOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setDisableOpen(false)} className="btn-secondary">
              Отказ
            </button>
            <button type="submit" form="disable-2fa" disabled={busy} className="btn-danger">
              Изключи
            </button>
          </>
        }
      >
        <form id="disable-2fa" onSubmit={disable} className="space-y-3">
          <p>Входът ще става само с парола. За потвърждение въведете паролата си.</p>
          <div>
            <label htmlFor="disable-password" className="label">
              Парола
            </label>
            <input id="disable-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser, refresh } = useUser({ redirectToLogin: true });
  const [myTools, setMyTools] = useState<Tool[] | null>(null);

  useEffect(() => {
    if (!user) return;
    apiJson<Paginated<Tool>>("/api/tools?mine=1&per_page=50")
      .then((r) => setMyTools(r.data))
      .catch(() => setMyTools([]));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Loading />;

  return (
    <main className="page space-y-6">
      <div className="flex items-center gap-4">
        <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-violet-600 text-xl font-semibold text-white">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="page-title">{user.name}</h1>
          <p className="text-sm text-slate-600">
            {roleLabel(user.role)} · {user.email}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Лични данни</h2>
          <ProfileForm user={user} onSaved={setUser} />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Двуфакторна автентикация (2FA)</h2>
          <TwoFactorSection user={user} onChange={refresh} />
        </Card>
      </div>

      <section id="my-tools" className="scroll-mt-20">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Моите предложения</h2>
          <Link href="/tools/new" className="btn-secondary btn-sm">
            + Добави
          </Link>
        </div>
        {!myTools ? (
          <Loading />
        ) : myTools.length === 0 ? (
          <EmptyState title="Още не сте предложили инструмент.">
            <Link href="/tools/new" className="text-indigo-700 hover:underline">
              Предложете първия
            </Link>
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} showStatus />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
