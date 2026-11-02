"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";

const FEATURES = [
  { title: "Каталог с AI инструменти", text: "Търсене и филтри по роля, категория и тагове. Рейтинг и коментари от колегите." },
  { title: "Одобрение от администратор", text: "Новите предложения се преглеждат в админ панела, преди да станат видими за всички." },
  { title: "Сигурен вход", text: "Двуфакторна автентикация с Google Authenticator и одит лог на всички действия." },
];

export default function Home() {
  const { user } = useUser();

  return (
    <main className="page">
      <section className="mx-auto max-w-3xl py-10 text-center sm:py-16">
        <p className="mb-4 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
          Laravel + Next.js · Vibecode Academy
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          AI инструментите на екипа <span className="text-indigo-600">на едно място</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
          Споделяйте инструментите, които работят, вижте какво използват колегите от вашата роля и оценявайте.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={user ? "/dashboard" : "/login"} className="btn-primary px-6! py-3! text-base!">
            {user ? "Към таблото" : "Вход в системата"}
          </Link>
          {user && (
            <Link href="/tools" className="btn-secondary px-6! py-3! text-base!">
              Разгледай инструментите
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
