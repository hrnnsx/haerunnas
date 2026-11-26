import type { AnchorHTMLAttributes } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Underlined link that opens in a new tab for http(s) URLs. */
export default function ExternalLink({ href, className = "", children, ...rest }: Props) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`underline decoration-neutral-600 underline-offset-4 transition-colors hover:text-white hover:decoration-neutral-200 ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}