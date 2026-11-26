import type { ReactNode } from "react";

type Props = { id: string; title: string; intro?: string; children: ReactNode };

export default function Section({ id, title, intro, children }: Props) {
  return (
    <section id={id} className="scroll-mt-20 py-12 md:py-16">
      <div className="flex items-center gap-4">
        <h2 className="text-lg text-neutral-50">{title}</h2>
        <span aria-hidden className="flex-1 border-t border-dashed border-neutral-700" />
      </div>
      {intro && <p className="mt-2 max-w-prose text-neutral-500">{intro}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}