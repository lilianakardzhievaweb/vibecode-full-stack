import { ReactNode } from "react";
import { STATUS_LABELS, ToolStatus } from "@/lib/types";

const COLORS = {
  blue: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  gray: "bg-slate-100 text-slate-700 ring-slate-500/20",
  yellow: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  purple: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export type BadgeColor = keyof typeof COLORS;

// Малък етикет за категория, роля, таг или статус
export default function Badge({ children, color = "gray" }: { children: ReactNode; color?: BadgeColor }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORS[color]}`}>
      {children}
    </span>
  );
}

const STATUS_COLORS: Record<ToolStatus, BadgeColor> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

export function StatusBadge({ status }: { status: ToolStatus }) {
  return <Badge color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>;
}
