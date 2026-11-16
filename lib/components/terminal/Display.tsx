
export type ViewType =
  | "neofetch"
  | "about"
  | "projects"
  | "experience"
  | "skills"
  | "contact"
  | "help";

interface DisplayProps {
  view: ViewType;
  message?: string;
}

export default function Display({ view, message }: DisplayProps) {
  const renderContent = () => {
    switch (view) {
      case "neofetch":
        return (
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            {/* ASCII Logo */}
            <pre className="font-mono text-xs leading-tight text-slate-400">
{`       █
     █████
    ███████
   ███ █████
   █████████
    ███████
      ███`}
            </pre>

            {/* System Information */}
            <div className="font-mono text-sm leading-7">
              <h1 className="text-lg font-bold text-white">
                haerunnas@system
              </h1>

              <div className="mb-2 h-px w-full bg-white/20" />

              <p><span className="text-slate-500">OS:</span> Haerunnas OS</p>
              <p><span className="text-slate-500">Host:</span> Personal Portfolio</p>
              <p><span className="text-slate-500">Role:</span> Backend Developer</p>
              <p><span className="text-slate-500">Stack:</span> Go, Node.js</p>
              <p><span className="text-slate-500">Database:</span> PostgreSQL</p>
              <p><span className="text-slate-500">Shell:</span> haerunnas-shell</p>
            </div>
          </div>
        );

      case "about":
        return (
          <section className="space-y-4">
            <p className="font-mono text-xs text-slate-500">
              SYSTEM / ABOUT
            </p>
            <h1 className="text-3xl font-semibold">
              About Me.
            </h1>
            <p className="max-w-2xl leading-7 text-neutral-400">
              Backend-focused Computer Science student at UIN Syarif
              Hidayatullah Jakarta. Interested in building reliable APIs,
              backend services, and maintainable systems.
            </p>
          </section>
        );

      case "projects":
        return (
          <section className="space-y-4">
            <p className="font-mono text-xs text-slate-500">
              SYSTEM / PROJECTS
            </p>
            <h1 className="text-3xl font-semibold">Projects.</h1>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-lg border border-white/10 bg-white/3 p-4">
                <h2 className="font-medium">BiteShare</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Food donation and e-commerce platform.
                </p>
                <p className="mt-3 font-mono text-xs text-slate-500">
                  Go / Gin / PostgreSQL
                </p>
              </article>
            </div>
          </section>
        );

      case "experience":
        return (
          <section className="space-y-4">
            <p className="font-mono text-xs text-slate-500">
              SYSTEM / EXPERIENCE
            </p>
            <h1 className="text-3xl font-semibold">Experience.</h1>
            <p className="text-neutral-400">
              Experience and organizational activities will appear here.
            </p>
          </section>
        );

      case "skills":
        return (
          <section className="space-y-4">
            <p className="font-mono text-xs text-slate-500">
              SYSTEM / SKILLS
            </p>
            <h1 className="text-3xl font-semibold">Technical Skills.</h1>

            <div className="flex flex-wrap gap-2">
              {["Go", "Node.js", "PostgreSQL", "MySQL", "REST API", "Git"].map(
                (skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-white/10 px-3 py-2 font-mono text-sm text-neutral-300"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </section>
        );

      case "contact":
        return (
          <section className="space-y-4">
            <p className="font-mono text-xs text-slate-500">
              SYSTEM / CONTACT
            </p>
            <h1 className="text-3xl font-semibold">Get in touch.</h1>
            <p className="text-neutral-400">
              Feel free to reach out for collaboration or opportunities.
            </p>
            <a
              href="mailto:your-email@example.com"
              className="inline-block text-sm text-slate-300 underline underline-offset-4"
            >
              Send an email
            </a>
          </section>
        );
      case "help":
        return (
          <section className="space-y-4">
            <p className="font-mono text-xs text-slate-500">
              SYSTEM / COMMANDS
            </p>

            <h1 className="text-3xl font-semibold">Available Commands.</h1>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["neofetch", "System information"],
                ["about", "About me"],
                ["projects", "My projects"],
                ["experience", "Work and organizational experience"],
                ["skills", "Technical skills"],
                ["contact", "Contact information"],
                ["clear", "Reset display"],
              ].map(([command, description]) => (
                <div
                  key={command}
                  className="border border-white/10 rounded-md p-3"
                >
                  <p className="font-mono text-sm text-slate-300">
                    {command}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
    }
  };

  return (
  <div className="space-y-4">
    {renderContent()}
    <span className="text-sm">
      {
        `
        Available commands:"
        help       Show available commands
        about      About me
        projects   View my projects
        skills     View my technical skills
        contact    Get in touch
        clear      Clear terminal
        ff         System information`
      }
    </span>
    {message && (
      <p className="font-mono text-sm text-red-400">
        {message}
      </p>
    )}
  </div>
);
}
