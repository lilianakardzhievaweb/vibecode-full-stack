"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiJson } from "@/lib/api";
import { Tool } from "@/lib/types";
import { useUser } from "@/hooks/useUser";
import ToolForm from "@/components/ToolForm";
import { EmptyState, Loading } from "@/components/States";

export default function EditToolPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser({ redirectToLogin: true });
  const [tool, setTool] = useState<Tool | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiJson<{ data: Tool }>(`/api/tools/${id}`)
      .then((res) => setTool(res.data))
      .catch(() => setNotFound(true));
  }, [user, id]);

  if (notFound) return <main className="page"><EmptyState title="Инструментът не е намерен." /></main>;
  if (!tool) return <Loading />;

  // Само авторът или owner може да редактира (проверява се и в Laravel)
  if (!tool.can_edit) {
    return (
      <main className="page">
        <EmptyState title="Нямате права да редактирате този инструмент.">
          <Link href={`/tools/${tool.id}`} className="text-indigo-700 hover:underline">
            Обратно към инструмента
          </Link>
        </EmptyState>
      </main>
    );
  }

  return (
    <main className="page max-w-3xl! space-y-6">
      <h1 className="page-title">Редакция: {tool.name}</h1>
      <ToolForm tool={tool} />
    </main>
  );
}
