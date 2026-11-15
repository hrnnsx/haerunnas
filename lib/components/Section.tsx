import type { ReactNode } from "react";

type Props = {
  id: string;
  children: ReactNode;
};

export default function Section({ id, children }: Props) {
  return (
    <section id={id} className="relative z-10 w-screen h-auto">
      {children}
    </section>
  );
}