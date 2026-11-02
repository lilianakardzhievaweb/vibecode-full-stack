"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ApiError, apiJson } from "@/lib/api";
import { Comment, DIFFICULTY_LABELS, Tool } from "@/lib/types";
import { roleLabel } from "@/lib/roles";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/context/ToastContext";
import Card from "@/components/Card";
import Badge, { StatusBadge } from "@/components/Badge";
import Modal from "@/components/Modal";
import { RatingDisplay, RatingInput } from "@/components/StarRating";
import { EmptyState, Loading } from "@/components/States";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-indigo-700 hover:underline">
      {children}
    </a>
  );
}

export default function ToolPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useUser({ redirectToLogin: true });

  const [tool, setTool] = useState<Tool | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiJson<{ data: Tool }>(`/api/tools/${id}`)
      .then((res) => setTool(res.data))
      .catch(() => setNotFound(true));
    apiJson<Comment[]>(`/api/tools/${id}/comments`)
      .then(setComments)
      .catch(() => setComments([]));
  }, [user, id]);

  async function handleDelete() {
    if (!tool) return;
    try {
      await apiJson(`/api/tools/${tool.id}`, { method: "DELETE" });
      toast.success(`„${tool.name}“ е изтрит.`);
      router.push("/tools");
    } catch (e) {
      toast.error((e as ApiError).firstMessage);
      setConfirmDelete(false);
    }
  }

  async function handleRate(rating: number) {
    if (!tool) return;
    try {
      const res = await apiJson<{ average_rating: number; ratings_count: number; my_rating: number }>(`/api/tools/${tool.id}/rating`, {
        method: "PUT",
        body: JSON.stringify({ rating }),
      });
      setTool({ ...tool, ...res });
      toast.success(`Оценихте „${tool.name}“ с ${rating} ★`);
    } catch (e) {
      toast.error((e as ApiError).firstMessage);
    }
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!tool || !newComment.trim()) return;
    setPosting(true);
    try {
      const comment = await apiJson<Comment>(`/api/tools/${tool.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: newComment }),
      });
      setComments([comment, ...(comments ?? [])]);
      setTool({ ...tool, comments_count: tool.comments_count + 1 });
      setNewComment("");
      toast.success("Коментарът е публикуван.");
    } catch (e) {
      toast.error((e as ApiError).firstMessage);
    } finally {
      setPosting(false);
    }
  }

  async function handleDeleteComment(comment: Comment) {
    if (!tool) return;
    try {
      await apiJson(`/api/comments/${comment.id}`, { method: "DELETE" });
      setComments((comments ?? []).filter((c) => c.id !== comment.id));
      setTool({ ...tool, comments_count: Math.max(0, tool.comments_count - 1) });
      toast.success("Коментарът е изтрит.");
    } catch (e) {
      toast.error((e as ApiError).firstMessage);
    }
  }

  if (notFound) {
    return (
      <main className="page">
        <EmptyState title="Инструментът не е намерен.">
          <Link href="/tools" className="text-indigo-700 hover:underline">
            Към всички инструменти
          </Link>
        </EmptyState>
      </main>
    );
  }
  if (!tool) return <Loading />;

  const approved = tool.status === "approved";

  return (
    <main className="page max-w-4xl! space-y-6">
      <Link href="/tools" className="text-sm font-medium text-indigo-700 hover:underline">
        ← Всички инструменти
      </Link>

      {/* Статус - вижда се от автора и администратора, докато инструментът не е одобрен */}
      {tool.status === "pending" && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Чака одобрение.</strong> Инструментът ще стане видим за всички, след като администратор го одобри.
        </div>
      )}
      {tool.status === "rejected" && (
        <div role="status" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <strong>Отказан.</strong> {tool.rejection_reason ?? "Администраторът не е посочил причина."}
          {tool.can_edit && " Редактирайте го, за да го изпратите отново за преглед."}
        </div>
      )}

      <Card className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="page-title">{tool.name}</h1>
              {!approved && <StatusBadge status={tool.status} />}
            </div>
            <ExternalLink href={tool.url}>{tool.url}</ExternalLink>
            <div>
              <RatingDisplay value={tool.average_rating} count={tool.ratings_count} size="lg" />
            </div>
          </div>
          {tool.can_edit && (
            <div className="flex shrink-0 gap-2">
              <Link href={`/tools/${tool.id}/edit`} className="btn-secondary">
                Редактирай
              </Link>
              <button onClick={() => setConfirmDelete(true)} className="btn-danger">
                Изтрий
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tool.categories.map((c) => (
            <Badge key={c.id} color="blue">
              {c.name}
            </Badge>
          ))}
          {tool.tags.map((t) => (
            <Badge key={t.id}>#{t.name}</Badge>
          ))}
          {tool.difficulty && <Badge color="purple">{DIFFICULTY_LABELS[tool.difficulty]}</Badge>}
        </div>

        <Section title="Описание">
          <p className="whitespace-pre-wrap text-slate-800">{tool.description}</p>
        </Section>

        <Section title="Как се използва">
          <p className="whitespace-pre-wrap text-slate-800">{tool.usage}</p>
        </Section>

        <Section title="Подходящ за роли">
          <div className="flex flex-wrap gap-1.5">
            {tool.roles.map((r) => (
              <Badge key={r.id} color="green">
                {r.name}
              </Badge>
            ))}
          </div>
        </Section>

        {tool.examples && (
          <Section title="Реални примери">
            <p className="whitespace-pre-wrap text-slate-800">{tool.examples}</p>
          </Section>
        )}

        {(tool.documentation_url || tool.video_url || tool.example_links.length > 0) && (
          <Section title="Линкове">
            <ul className="ml-5 list-disc space-y-1 text-sm">
              {tool.documentation_url && (
                <li>
                  Документация: <ExternalLink href={tool.documentation_url}>{tool.documentation_url}</ExternalLink>
                </li>
              )}
              {tool.video_url && (
                <li>
                  Видео: <ExternalLink href={tool.video_url}>{tool.video_url}</ExternalLink>
                </li>
              )}
              {tool.example_links.map((link) => (
                <li key={link}>
                  Пример: <ExternalLink href={link}>{link}</ExternalLink>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {tool.documentation && (
          <Section title="Документация">
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm">{tool.documentation}</pre>
          </Section>
        )}

        {tool.images.length > 0 && (
          <Section title="Изображения">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tool.images.map((img, i) => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`${tool.name} - изображение ${i + 1}`} className="w-full rounded-lg border border-slate-200" />
                </a>
              ))}
            </div>
          </Section>
        )}

        <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
          Добавен от {tool.author?.name ?? "неизвестен"} на {new Date(tool.created_at).toLocaleDateString("bg-BG")}
        </p>
      </Card>

      {/* Рейтинг и коментари - само за одобрени инструменти */}
      {approved && (
        <Card className="space-y-6">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Вашата оценка</h2>
              <p className="text-sm text-slate-600">{tool.my_rating ? "Може да я промените по всяко време." : "Колко полезен е този инструмент за вас?"}</p>
            </div>
            <RatingInput value={tool.my_rating} onChange={handleRate} />
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-6">
            <h2 className="font-semibold text-slate-900">Коментари ({tool.comments_count})</h2>

            <form onSubmit={handleComment} className="space-y-2">
              <label htmlFor="comment" className="sr-only">
                Нов коментар
              </label>
              <textarea
                id="comment"
                rows={3}
                maxLength={2000}
                className="input"
                placeholder="Споделете опита си с инструмента..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <button type="submit" disabled={posting || !newComment.trim()} className="btn-primary">
                  {posting ? "Публикуване..." : "Публикувай"}
                </button>
              </div>
            </form>

            {!comments ? (
              <Loading />
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500">Все още няма коментари. Бъдете първи!</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">
                        <span className="font-medium text-slate-900">{c.author?.name ?? "Изтрит потребител"}</span>
                        {c.author && <span className="text-slate-500"> · {roleLabel(c.author.role)}</span>}
                        <span className="text-slate-500"> · {new Date(c.created_at).toLocaleDateString("bg-BG")}</span>
                      </p>
                      {c.can_delete && (
                        <button
                          onClick={() => handleDeleteComment(c)}
                          className="text-xs text-red-700 hover:underline"
                          aria-label={`Изтрий коментара на ${c.author?.name ?? "потребител"}`}
                        >
                          Изтрий
                        </button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Card>
      )}

      <Modal
        open={confirmDelete}
        title="Изтриване на инструмент"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <button onClick={() => setConfirmDelete(false)} className="btn-secondary">
              Отказ
            </button>
            <button onClick={handleDelete} className="btn-danger">
              Да, изтрий
            </button>
          </>
        }
      >
        Сигурни ли сте, че искате да изтриете <strong>„{tool.name}“</strong>? Изображенията, оценките и коментарите също ще бъдат изтрити.
      </Modal>
    </main>
  );
}
