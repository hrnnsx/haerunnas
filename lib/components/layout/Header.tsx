"use client";

import { useEffect, useState } from "react";
import { navigation, profile } from "@/lib/data/portfolio";

export default function Header() {
  const [active, setActive] = useState("");

  // Highlights the nav link of the section currently in view.
  useEffect(() => {
    const ids = ["top", ...navigation.map((item) => item.href.slice(1))];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        if (hit) setActive(hit.target.id === "top" ? "" : hit.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-linear-to-b from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-6 py-5">
        <a href="#top" className="hidden text-neutral-100 sm:block">
          {profile.name}
        </a>
        <nav aria-label="Sections" className="flex flex-wrap gap-x-5 gap-y-1">
          {navigation.map((item) => {
            const isActive = active === item.href.slice(1);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? "true" : undefined}
                className={`underline-offset-4 transition-colors hover:text-neutral-100 ${
                  isActive ? "text-neutral-50 underline" : "text-neutral-500"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}