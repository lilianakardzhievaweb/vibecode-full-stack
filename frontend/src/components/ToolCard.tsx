import Link from "next/link";
import { Tool } from "@/lib/types";
import Badge, { StatusBadge } from "@/components/Badge";
import { RatingDisplay } from "@/components/StarRating";

// Карта на инструмент в списъците
export default function ToolCard({ tool, showStatus = false }: { tool: Tool; showStatus?: boolean }) {
  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      {tool.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tool.images[0].url} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div aria-hidden className="flex h-36 items-center justify-center bg-linear-to-br from-indigo-50 to-violet-100 text-4xl font-bold text-indigo-300">
          {tool.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">{tool.name}</h3>
          {showStatus && tool.status !== "approved" && <StatusBadge status={tool.status} />}
        </div>
        <p className="line-clamp-2 text-sm text-slate-600">{tool.description}</p>

        <div className="flex flex-wrap gap-1">
          {tool.categories.map((c) => (
            <Badge key={c.id} color="blue">
              {c.name}
            </Badge>
          ))}
          {tool.roles.slice(0, 3).map((r) => (
            <Badge key={r.id} color="green">
              {r.name}
            </Badge>
          ))}
          {tool.roles.length > 3 && <Badge>+{tool.roles.length - 3}</Badge>}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <RatingDisplay value={tool.average_rating} count={tool.ratings_count} />
          <span className="text-xs text-slate-500">💬 {tool.comments_count}</span>
        </div>
      </div>
    </Link>
  );
}
