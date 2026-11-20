import type { ReactNode } from "react";

type Props = { children: ReactNode; className?: string };

/** Frosted square panel, so butterflies pass behind it without hurting legibility. */
export default function Card({ children, className = "" }: Props) {
  return (
    <article
      className={`border border-neutral-800 bg-[#0a0a0a]/70 p-5 backdrop-blur-sm transition-colors hover:border-neutral-500 ${className}`}
    >
      {children}
    </article>
  );
}