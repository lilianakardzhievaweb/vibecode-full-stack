// Ролите в системата и какво вижда всяка от тях.
// Когато добавите нова секция или роля, редактирате само този файл.

// Име на ролята за показване на екрана.
export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner (администратор)",
  backend: "Backend Developer",
  frontend: "Frontend Developer",
  pm: "Project Manager",
  qa: "QA",
  designer: "Designer",
};

export const USER_ROLES = Object.keys(ROLE_LABELS);

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

// Елемент от навигацията. roles = кои роли го виждат (ако липсва - всички влезли).
export type NavItem = {
  href: string;
  label: string;
  roles?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Табло" },
  { href: "/tools", label: "Инструменти" },
  { href: "/tools/new", label: "Добави" },
  { href: "/profile", label: "Профил" },
  { href: "/admin", label: "Админ панел", roles: ["owner"] },
];

export function navForRole(role: string): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

// Кратко описание на ролята за таблото
export const ROLE_INTRO: Record<string, string> = {
  owner: "Одобряваш новите предложения, управляваш ролите и следиш активността в одит лога.",
  backend: "Открий AI инструменти за API, бази данни, ревю на код и тестове.",
  frontend: "Открий AI инструменти за UI компоненти, стилове и бързо прототипиране.",
  pm: "Открий AI инструменти за спецификации, обобщения и планиране.",
  qa: "Открий AI инструменти за тестови сценарии и откриване на бъгове.",
  designer: "Открий AI инструменти за макети, изображения и визуални идеи.",
};

export function hasRole(role: string | undefined, ...roles: string[]): boolean {
  return !!role && roles.includes(role);
}
