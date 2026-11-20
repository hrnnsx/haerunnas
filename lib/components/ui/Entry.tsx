import type { ReactNode } from "react";
import ExternalLink from "./ExternalLink";

type Props = {
  title: string;
  subtitle?: string;
  /** Right-aligned small text, usually a date range. */
  meta?: string;
  href?: string;
  children?: ReactNode;
};

/**
 * One row in a list. Used by projects, experience, education and certifications,
 * so changing it restyles all of them.
 */
export default function Entry({ title, subtitle, meta, href, children }: Props) {
  return (
    <article className="border-t border-neutral-800 py-5 first:border-t-0 first:pt-0">
      <header className="flex items-baseline justify-between gap-4">
        <h3 className="text-neutral-100">
          {href ? <ExternalLink href={href}>{title}</ExternalLink> : title}
        </h3>
        {meta && (
          <span className="shrink-0 text-xs tabular-nums text-neutral-500">{meta}</span>
        )}
      </header>
      {subtitle && <p className="text-neutral-400">{subtitle}</p>}
      {children && <div className="mt-3 text-neutral-400">{children}</div>}
    </article>
  );
}