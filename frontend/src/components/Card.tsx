import { ReactNode } from "react";
import Link from "next/link";

type Props = {
  children: ReactNode;
  href?: string; // ако е зададен, картата е линк
  className?: string;
};

// Бяла карта с рамка. Използва се за менюта, списъци и форми.
export default function Card({ children, href, className = "" }: Props) {
  const classes = `block rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-5 ${
    href ? "transition hover:border-indigo-300 hover:shadow-md" : ""
  } ${className}`;

  return href ? (
    <Link href={href} className={classes}>
      {children}
    </Link>
  ) : (
    <div className={classes}>{children}</div>
  );
}
