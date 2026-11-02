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

export type ToolStatus = "pending" | "approved" | "rejected";

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
  status: ToolStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  author: { id: number; name: string } | null;
  categories: Category[];
  roles: Role[];
  tags: Tag[];
  images: ToolImage[];
  average_rating: number | null;
  ratings_count: number;
  comments_count: number;
  my_rating: number | null;
  can_edit: boolean;
  created_at: string;
};

export type Comment = {
  id: number;
  body: string;
  author: { id: number; name: string; role: string } | null;
  can_delete: boolean;
  created_at: string;
};

export type ActivityLogEntry = {
  id: number;
  action: string;
  description: string;
  properties: Record<string, unknown> | null;
  subject_type: string | null;
  subject_id: number | null;
  user: { id: number; name: string; role: string } | null;
  ip_address: string | null;
  created_at: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  two_factor_enabled: boolean;
  tools_count: number;
  created_at: string;
};

export type Stats = {
  tools_total: number;
  categories_total: number;
  top_categories: (Category & { tools_count: number })[];
  pending_total: number | null;
  my_tools_total: number;
  cached_at: string;
};

// Отговор със страници (pagination) от Laravel
export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
};

// Простата пагинация на Laravel (без Resource) връща полетата на първо ниво
export type SimplePaginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type Difficulty = "beginner" | "intermediate" | "advanced";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Начинаещ",
  intermediate: "Средно ниво",
  advanced: "Напреднал",
};

export const STATUS_LABELS: Record<ToolStatus, string> = {
  pending: "Чака одобрение",
  approved: "Одобрен",
  rejected: "Отказан",
};
