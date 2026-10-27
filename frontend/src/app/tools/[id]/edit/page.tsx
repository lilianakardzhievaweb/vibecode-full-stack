"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Tool } from "@/lib/types";
import { useUser } from "@/hooks/useUser";
import ToolForm from "@/components/ToolForm";

export default function EditToolPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser({ redirectToLogin: true });
  const [tool, setTool] = useState<Tool | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/api/tools/${id}`).then(async (res) => {
      if (res.ok) setTool((await res.json()).data);
    });
  }, [user, id]);

  if (!tool) return <p className="text-center text-gray-500 py-16">Зареждане...</p>;

  // Само авторът или owner може да редактира (проверява се и в Laravel)
  if (!tool.can_edit) {
    return <p className="text-center text-gray-500 py-16">Нямате права да редактирате този инструмент.</p>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-gray-900">
      <h1 className="text-2xl font-semibold">Редакция: {tool.name}</h1>
      <ToolForm tool={tool} />
    </main>
  );
}
