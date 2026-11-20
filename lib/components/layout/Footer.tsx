import { profile } from "@/lib/data/portfolio";
import ExternalLink from "@/lib/components/ui/ExternalLink";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-4xl px-6 pb-12 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-neutral-800 pt-6 text-xs text-neutral-500">
        <span>
          {new Date().getFullYear()} {profile.name}
        </span>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {profile.links.map((link) => (
            <ExternalLink key={link.href} href={link.href}>
              {link.label}
            </ExternalLink>
          ))}
          <ExternalLink href={`mailto:${profile.email}`}>{profile.email}</ExternalLink>
          <ExternalLink href="#top">back to top</ExternalLink>
        </div>
      </div>
    </footer>
  );
}