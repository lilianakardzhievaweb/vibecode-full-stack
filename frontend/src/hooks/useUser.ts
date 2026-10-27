"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUser, User } from "@/lib/api";

// Връща влезлия потребител. С { redirectToLogin: true } праща към /login, ако няма вход.
export function useUser({ redirectToLogin = false } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Проверяваме сесията при всяка смяна на страницата (напр. след вход/изход).
  useEffect(() => {
    getUser()
      .catch(() => null)
      .then((u) => {
        setUser(u);
        if (!u && redirectToLogin) router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [pathname, redirectToLogin, router]);

  return { user, loading, setUser };
}
