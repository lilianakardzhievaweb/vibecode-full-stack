"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { DIFFICULTY_LABELS, Tool } from "@/lib/types";
import { useUser } from "@/hooks/useUser";
import Card from "@/components/Card";
import Badge from "@/components/Badge";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 mb-1">{title}</h2>
      {children}
    </div>
  );
}

export default function ToolPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser({ redirectToLogin: true });
  const [tool, setTool] = useState<Tool | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/api/tools/${id}`).then(async (res) => {
      if (res.ok) setTool((await res.json()).data);
      else setNotFound(true);
    });
  }, [user, id]);

  async function handleDelete() {
    if (!tool || !confirm(`Сигурни ли сте, че искате да изтриете „${tool.name}“?`)) return;
    const res = await apiFetch(`/api/tools/${tool.id}`, { method: "DELETE" });
    if (res.ok) router.push("/tools");
    else alert("Нямате права да изтриете този инструмент.");
  }

  if (notFound) return <p className="text-center text-gray-500 py-16">Инструментът не е намерен.</p>;
  if (!tool) return <p className="text-center text-gray-500 py-16">Зареждане...</p>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-gray-900">
      <Link href="/tools" className="text-sm text-blue-600 hover:underline">
        ← Всички инструменти
      </Link>

      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{tool.name}</h1>
            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
              {tool.url}
            </a>
          </div>
          {tool.can_edit && (
            <div className="flex gap-2 shrink-0">
              <Link href={`/tools/${tool.id}/edit`} className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
                Редактирай
              </Link>
              <button onClick={handleDelete} className="bg-red-600 text-white rounded px-3 py-1.5 text-sm hover:bg-red-700">
                Изтрий
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {tool.categories.map((c) => (
            <Badge key={c.id} color="blue">{c.name}</Badge>
          ))}
          {tool.tags.map((t) => (
            <Badge key={t.id}>#{t.name}</Badge>
          ))}
          {tool.difficulty && <Badge>{DIFFICULTY_LABELS[tool.difficulty]}</Badge>}
        </div>

        <Section title="Описание">
          <p className="whitespace-pre-wrap">{tool.description}</p>
        </Section>

        <Section title="Как се използва">
          <p className="whitespace-pre-wrap">{tool.usage}</p>
        </Section>

        <Section title="Подходящ за роли">
          <div className="flex flex-wrap gap-1">
            {tool.roles.map((r) => (
              <Badge key={r.id} color="green">{r.name}</Badge>
            ))}
          </div>
        </Section>

        {tool.examples && (
          <Section title="Реални примери">
            <p className="whitespace-pre-wrap">{tool.examples}</p>
          </Section>
        )}

        {(tool.documentation_url || tool.video_url || tool.example_links.length > 0) && (
          <Section title="Линкове">
            <ul className="list-disc ml-5 text-sm space-y-1">
              {tool.documentation_url && (
                <li>
                  Документация:{" "}
                  <a href={tool.documentation_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {tool.documentation_url}
                  </a>
                </li>
              )}
              {tool.video_url && (
                <li>
                  Видео:{" "}
                  <a href={tool.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {tool.video_url}
                  </a>
                </li>
              )}
              {tool.example_links.map((link) => (
                <li key={link}>
                  Пример:{" "}
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {tool.documentation && (
          <Section title="Документация">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-3 font-mono">{tool.documentation}</pre>
          </Section>
        )}

        {tool.images.length > 0 && (
          <Section title="Изображения">
            <div className="grid grid-cols-2 gap-3">
              {tool.images.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full rounded border" />
                </a>
              ))}
            </div>
          </Section>
        )}

        <p className="text-xs text-gray-500">
          Добавен от {tool.author?.name ?? "неизвестен"} на {new Date(tool.created_at).toLocaleDateString("bg-BG")}
        </p>
      </Card>
    </main>
  );
}
