import type { ReactNode } from "react";

/** Vertical dashed line. Items sit on it, marked with a "+". */
export function Timeline({ children }: { children: ReactNode }) {
  return <ol className="ml-2 border-l border-dashed border-neutral-700">{children}</ol>;
}

type ItemProps = {
  title: string;
  subtitle?: string;
  /** Right-aligned small text, usually a date range. */
  meta?: string;
  children?: ReactNode;
};

export function TimelineItem({ title, subtitle, meta, children }: ItemProps) {
  return (
    <li className="relative pb-10 pl-8 last:pb-0">
      <span
        aria-hidden
        className="absolute left-[-0.5ch] top-0 bg-[#0a0a0a] text-base leading-relaxed text-neutral-300"
      >
        +
      </span>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="text-base leading-relaxed text-neutral-50">{title}</h3>
        {meta && <span className="text-xs tabular-nums text-neutral-500">{meta}</span>}
      </header>
      {subtitle && <p className="text-neutral-400">{subtitle}</p>}
      {children && <div className="mt-3 text-neutral-400">{children}</div>}
    </li>
  );
}