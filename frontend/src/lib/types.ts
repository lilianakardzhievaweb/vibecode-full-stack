// Типове на данните, които връща Laravel API-то

export type Option = {
  id: number;
  name: string;
  slug: string;
};

export type Role = Option;
export type Category = Option;
export type Tag = Option;

export type ToolImage = {
  id: number;
  url: string;
};

export type Tool = {
  id: number;
  name: string;
  url: string;
  documentation_url: string | null;
  documentation: string | null;
  description: string;
  usage: string;
  examples: string | null;
  example_links: string[];
  video_url: string | null;
  difficulty: Difficulty | null;
  author: { id: number; name: string } | null;
  categories: Category[];
  roles: Role[];
  tags: Tag[];
  images: ToolImage[];
  can_edit: boolean;
  created_at: string;
};

// Отговор със страници (pagination) от Laravel
export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
};

export type Difficulty = "beginner" | "intermediate" | "advanced";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Начинаещ",
  intermediate: "Средно ниво",
  advanced: "Напреднал",
};
