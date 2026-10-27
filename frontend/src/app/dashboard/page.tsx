"use client";

import { useUser } from "@/hooks/useUser";
import { ROLE_MENUS, roleLabel } from "@/lib/roles";
import Card from "@/components/Card";

export default function DashboardPage() {
  // Ако няма активна сесия, useUser връща потребителя към /login.
  const { user } = useUser({ redirectToLogin: true });

  if (!user) {
    return <p className="text-center text-gray-500 py-16">Зареждане...</p>;
  }

  const menu = ROLE_MENUS[user.role] ?? [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-gray-900">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Добре дошъл, {user.name}!</h1>
        <p className="mt-2 text-gray-600">
          Ти си с роля:{" "}
          <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            {roleLabel(user.role)}
          </span>
        </p>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-4">AI инструменти</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card href="/tools">
            <div className="font-medium">Всички инструменти</div>
            <div className="text-sm text-gray-500">Преглед и филтри по роля, категория, име и тагове</div>
          </Card>
          <Card href="/tools/new">
            <div className="font-medium">+ Добави инструмент</div>
            <div className="text-sm text-gray-500">Сподели нов AI инструмент с екипа</div>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Твоето меню</h2>
        {menu.length === 0 ? (
          <p className="text-gray-500">Няма налични действия за тази роля.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {menu.map((item) => (
              <Card key={item.label}>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-500">{item.description}</div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
