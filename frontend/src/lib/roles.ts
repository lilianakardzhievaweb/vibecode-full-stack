// Име на ролята за показване на екрана.
export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  backend: "Backend Developer",
  frontend: "Frontend Developer",
  pm: "Project Manager",
  qa: "QA",
  designer: "Designer",
};

export type MenuItem = {
  label: string;
  description: string;
};

// Бутони/менюта според ролята. Засега са заготовки, ще ги надграждаме в следващите дни.
export const ROLE_MENUS: Record<string, MenuItem[]> = {
  owner: [
    { label: "Потребители", description: "Управление на потребители и роли" },
    { label: "Проекти", description: "Всички проекти в компанията" },
    { label: "Отчети", description: "Статистики и справки" },
    { label: "Настройки", description: "Настройки на системата" },
  ],
  backend: [
    { label: "API", description: "Документация и ендпойнти" },
    { label: "База данни", description: "Миграции и модели" },
    { label: "Задачи", description: "Моите backend задачи" },
  ],
  frontend: [
    { label: "Компоненти", description: "UI компоненти" },
    { label: "Страници", description: "Страници в приложението" },
    { label: "Задачи", description: "Моите frontend задачи" },
  ],
  pm: [
    { label: "Проекти", description: "Проекти и срокове" },
    { label: "Екип", description: "Хора и разпределение" },
    { label: "Задачи", description: "Всички задачи" },
  ],
  qa: [
    { label: "Тестове", description: "Тестови сценарии" },
    { label: "Бъгове", description: "Докладвани проблеми" },
  ],
  designer: [
    { label: "Дизайни", description: "Макети и прототипи" },
    { label: "Ресурси", description: "Иконки, шрифтове, цветове" },
  ],
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
