import { ReactNode } from "react";

const COLORS = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-700",
};

// Малък етикет за категория, роля или таг
export default function Badge({ children, color = "gray" }: { children: ReactNode; color?: keyof typeof COLORS }) {
  return <span className={`inline-block text-xs px-2 py-0.5 rounded ${COLORS[color]}`}>{children}</span>;
}
