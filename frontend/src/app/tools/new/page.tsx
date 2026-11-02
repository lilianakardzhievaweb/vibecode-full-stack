"use client";

import { useUser } from "@/hooks/useUser";
import ToolForm from "@/components/ToolForm";
import { Loading } from "@/components/States";

// Всеки влязъл потребител може да предложи инструмент. Owner публикува директно, останалите - след одобрение.
export default function NewToolPage() {
  const { user } = useUser({ redirectToLogin: true });

  if (!user) return <Loading />;

  return (
    <main className="page max-w-3xl! space-y-6">
      <div>
        <h1 className="page-title">Нов AI инструмент</h1>
        <p className="mt-1 text-sm text-slate-600">
          {user.role === "owner"
            ? "Като администратор инструментът ще бъде публикуван веднага."
            : "След изпращане инструментът ще бъде прегледан от администратор, преди да стане видим за всички."}
        </p>
      </div>
      <ToolForm />
    </main>
  );
}
