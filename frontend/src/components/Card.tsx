import { ReactNode } from "react";
import Link from "next/link";

type Props = {
  children: ReactNode;
  href?: string; // ако е зададен, картата е линк
  className?: string;
};

// Бяла карта със сянка. Използва се за менюта, списъци и форми.
export default function Card({ children, href, className = "" }: Props) {
  const classes = `block bg-white rounded-lg shadow p-4 text-gray-900 ${
    href ? "hover:ring-2 hover:ring-blue-500" : ""
  } ${className}`;

  return href ? (
    <Link href={href} className={classes}>
      {children}
    </Link>
  ) : (
    <div className={classes}>{children}</div>
  );
}
