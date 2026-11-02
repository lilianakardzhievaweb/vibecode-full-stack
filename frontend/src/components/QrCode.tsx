"use client";

import { useMemo } from "react";
import { encodeQr } from "@/lib/qrcode";

// QR код като SVG (за сканиране с Google Authenticator)
export default function QrCode({ value, size = 192, label }: { value: string; size?: number; label: string }) {
  const matrix = useMemo(() => encodeQr(value), [value]);
  const quiet = 4; // бяло поле около кода
  const total = matrix.length + quiet * 2;

  // Един <path> за всички тъмни модули - по-леко от стотици <rect>
  const path = matrix
    .flatMap((row, y) => row.map((dark, x) => (dark ? `M${x + quiet},${y + quiet}h1v1h-1z` : "")))
    .join("");

  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      className="rounded-lg border border-slate-200 bg-white"
    >
      <rect width={total} height={total} fill="#fff" />
      <path d={path} fill="#0f172a" />
    </svg>
  );
}
