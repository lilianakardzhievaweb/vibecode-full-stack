import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-900">
      <h1 className="text-3xl font-semibold">Vibecode Full Stack Starter Kit</h1>
      <p className="mt-4 text-gray-600">Laravel + Next.js приложение с вход и роли.</p>
      <Link
        href="/dashboard"
        className="inline-block mt-8 bg-blue-600 text-white rounded px-5 py-2 hover:bg-blue-700"
      >
        Към таблото
      </Link>
    </main>
  );
}
