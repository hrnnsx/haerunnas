import type { ReactNode } from "react";

type Props = {
  id: string;
  label: string;
  children: ReactNode;
};

export default function Section({ id, label, children }: Props) {
  return (
    <section id={id} className="relative z-10 px-6 py-24 sm:px-12">
      <p className="mb-10 font-mono text-xs uppercase tracking-widest text-white/50">[ {label} ]</p>
      {children}
    </section>
  );
}