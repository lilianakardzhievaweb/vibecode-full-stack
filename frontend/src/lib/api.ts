// NEXT_PUBLIC_API_URL е "http://localhost:8201/api" (от docker-compose).
// /login, /logout и /sanctum/csrf-cookie са в корена на Laravel, затова махаме "/api".
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8201/api";
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  two_factor_enabled: boolean;
  created_at?: string;
};

// Laravel записва CSRF токена в бисквитката XSRF-TOKEN.
// Трябва да го върнем в хедъра X-XSRF-TOKEN при всяка POST заявка.
function getXsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// Обща функция за заявки: credentials "include" изпраща и приема бисквитките (сесията).
// При FormData (качване на файлове) браузърът сам слага Content-Type, затова не го задаваме.
export function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      "X-XSRF-TOKEN": getXsrfToken(),
      ...options.headers,
    },
  });
}

// Грешките от валидацията на Laravel: { "name": ["Полето е задължително."], ... }
export type ValidationErrors = Record<string, string[]>;

// Грешка от API-то: status (напр. 403, 422), съобщение и грешките по полета
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: ValidationErrors = {},
  ) {
    super(message);
  }

  // Първото съобщение за грешка (удобно за toast)
  get firstMessage(): string {
    return Object.values(this.errors)[0]?.[0] ?? this.message;
  }
}

/**
 * Заявка, която връща JSON или хвърля ApiError.
 * Пример: const tools = await apiJson<Paginated<Tool>>("/api/tools");
 */
export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(path, options);
  } catch {
    throw new ApiError(0, "Няма връзка със сървъра.");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallback: Record<number, string> = {
      401: "Моля, влезте в профила си.",
      403: "Нямате права за това действие.",
      404: "Не е намерено.",
      429: "Твърде много заявки. Опитайте след малко.",
    };
    throw new ApiError(res.status, data.message || fallback[res.status] || `Грешка ${res.status}`, data.errors ?? {});
  }
  return data as T;
}

// Връща влезлия потребител или null, ако няма активна сесия.
export async function getUser(): Promise<User | null> {
  const res = await apiFetch("/api/user");
  return res.ok ? res.json() : null;
}

export async function logout() {
  await apiFetch("/logout", { method: "POST" });
}
