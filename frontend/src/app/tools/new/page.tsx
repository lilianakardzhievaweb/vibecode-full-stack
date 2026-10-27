"use client";

import { useUser } from "@/hooks/useUser";
import ToolForm from "@/components/ToolForm";

// Всеки влязъл потребител може да добавя инструменти
export default function NewToolPage() {
  const { user } = useUser({ redirectToLogin: true });

  if (!user) return <p className="text-center text-gray-500 py-16">Зареждане...</p>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-gray-900">
      <h1 className="text-2xl font-semibold">Нов AI инструмент</h1>
      <ToolForm />
    </main>
  );
}
