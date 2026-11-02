"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUser, User } from "@/lib/api";

type UserContextValue = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refresh: () => Promise<User | null>;
};

const UserContext = createContext<UserContextValue | null>(null);

// Зарежда влезлия потребител веднъж и го споделя между хедъра и всички страници.
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await getUser().catch(() => null);
    setUser(u);
    setLoading(false);
    return u;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <UserContext.Provider value={{ user, loading, setUser, refresh }}>{children}</UserContext.Provider>;
}

/**
 * Връща влезлия потребител.
 * { redirectToLogin: true } - праща към /login, ако няма вход.
 * { roles: ["owner"] } - праща към /dashboard, ако потребителят няма нужната роля.
 */
export function useUser({ redirectToLogin = false, roles }: { redirectToLogin?: boolean; roles?: string[] } = {}) {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser трябва да се използва вътре в <UserProvider>.");

  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = context;
  const rolesKey = roles?.join(",");

  useEffect(() => {
    if (loading) return;
    if (!user && redirectToLogin) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (user && rolesKey && !rolesKey.split(",").includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [loading, user, redirectToLogin, rolesKey, router, pathname]);

  const allowed = !!user && (!rolesKey || rolesKey.split(",").includes(user.role));

  return { ...context, allowed };
}
