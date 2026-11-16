"use client";

import { useState } from "react";
import Butterflies from "@/lib/components/Butterflies";
import Terminal from "@/lib/components/terminal/Terminal";
import Display, { ViewType } from "@/lib/components/terminal/Display";

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState<ViewType>("neofetch");

  const handleCommand = (command: string) => {
    const validViews: ViewType[] = [
      "neofetch",
      "about",
      "projects",
      "experience",
      "skills",
      "contact",
      "help",
    ];

    if (validViews.includes(command as ViewType)) {
      setView(command as ViewType);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Butterflies
        theme="dark"
        white={1}
        butterflyOpacity={1}
        density={0.4}
      />

      {/* Pre-boot environment */}
      <section
        className={`
          fixed inset-0 z-10
          flex flex-col items-center justify-center gap-8 px-4
          transition-opacity duration-500
          ${booted ? "pointer-events-none opacity-0" : "opacity-100"}
        `}
      >
        <div className="fixed text-center top-80 self-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            Haerunnas.
          </h1>

          <p className="mt-2 font-mono text-sm text-neutral-500">
            Personal Computing Environment
          </p>
        </div>

        <Terminal
          onBootStart={() => {}}
          onBootComplete={() => setBooted(true)}
          onCommand={handleCommand}
        />
      </section>

      {/* Main system display */}
      {booted && (
        <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 pb-36 pt-12">
          <Display view={view} />
        </section>
      )}
    </main>
  );
}