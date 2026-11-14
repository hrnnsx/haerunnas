type Props = {
  href: string;
  children: string;
  external?: boolean;
};

export default function BracketLink({ href, children, external = false }: Props) {
  const idle = `[ ${children} ]`;
  const hover = `[  ${children}  ]`;

  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className="group inline-grid place-items-center whitespace-pre transition-colors hover:text-white"
    >
      <span aria-hidden className="invisible col-start-1 row-start-1 select-none">{hover}</span>
      <span className="col-start-1 row-start-1 group-hover:hidden">{idle}</span>
      <span className="col-start-1 row-start-1 hidden group-hover:inline">{hover}</span>
    </a>
  );
}