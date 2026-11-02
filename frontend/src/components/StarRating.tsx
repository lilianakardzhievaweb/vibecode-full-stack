"use client";

import { useState } from "react";

// Показва среден рейтинг, напр. ★★★★☆ 4.2 (12)
export function RatingDisplay({ value, count, size = "sm" }: { value: number | null; count: number; size?: "sm" | "lg" }) {
  const rounded = Math.round(value ?? 0);
  const text = size === "lg" ? "text-xl" : "text-sm";

  return (
    <span className="inline-flex items-center gap-1" aria-label={value ? `Рейтинг ${value} от 5 (${count} оценки)` : "Все още няма оценки"}>
      <span aria-hidden className={`${text} tracking-tight text-amber-500`}>
        {"★".repeat(rounded)}
        <span className="text-slate-300">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="text-xs text-slate-600">{value ? `${value.toFixed(1)} (${count})` : "няма оценки"}</span>
    </span>
  );
}

// Звезди за гласуване (1-5). Работи и с клавиатура - всяка звезда е бутон.
export function RatingInput({ value, onChange, disabled }: { value: number | null; onChange: (rating: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Вашата оценка" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} от 5`}
          disabled={disabled}
          onMouseEnter={() => setHover(star)}
          onClick={() => onChange(star)}
          className={`text-2xl leading-none transition-transform hover:scale-110 disabled:cursor-not-allowed ${star <= shown ? "text-amber-500" : "text-slate-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
