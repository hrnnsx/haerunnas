import type { ReactNode } from "react";

type Props = {
  href: string;
  variant?: "solid" | "outline";
  children: ReactNode;
};

const styles = {
  solid: "border-neutral-100 bg-neutral-100 text-neutral-950 hover:bg-white",
  outline:
    "border-neutral-600 bg-[#0a0a0a]/60 text-neutral-200 hover:border-neutral-200 hover:text-white",
};

export default function Button({ href, variant = "outline", children }: Props) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-block border px-5 py-2.5 transition-colors text-shadow-none ${styles[variant]}`}
    >
      {children}
    </a>
  );
}