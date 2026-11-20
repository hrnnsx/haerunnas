
export default function BiteShareOverview() {
  const features = [
    {
      number: "01",
      title: "Food Donation",
      description:
        "A platform that allows donors to submit food donations and provide the information needed for pickup.",
    },
    {
      number: "02",
      title: "Donation Management",
      description:
        "Administrators can review donation requests, approve or reject submissions, and arrange pickup schedules.",
    },
    {
      number: "03",
      title: "E-Commerce",
      description:
        "Processed food products can be managed as inventory and made available through an online storefront.",
    },
  ];

  const technologies = [
    "Go",
    "Gin",
    "PostgreSQL",
    "Supabase",
    "Docker",
    "ImageKit",
    "Resend",
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0b0b0f] text-white">
      <div className="mx-auto max-w-6xl space-y-12 p-6 md:p-10">

        {/* Header */}
        <header className="space-y-5">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span>PROJECTS</span>
            <span>/</span>
            <span className="text-white/70">BITESHARE</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl">
                  🍱
                </div>

                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    BiteShare
                  </h1>
                  <p className="text-sm text-white/40">
                    Food Donation & E-Commerce Platform
                  </p>
                </div>
              </div>
            </div>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
              Full-stack Project
            </span>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-emerald-950/50 via-[#101714] to-[#0b0b0f] p-7 md:p-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative max-w-2xl space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-emerald-300/70">
              About the project
            </p>

            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
              Turning surplus food into
              <span className="text-emerald-300"> shared value.</span>
            </h2>

            <p className="max-w-xl text-sm leading-7 text-white/60 md:text-base">
              BiteShare is a food donation and e-commerce platform designed
              to connect food donors with a donation management system and
              an online marketplace for processed food products.
            </p>
          </div>
        </section>

        {/* Project details */}
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Category", "Full-stack Development"],
            ["Architecture", "Two REST API Services"],
            ["Database", "Shared PostgreSQL"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/2.5 p-5"
            >
              <p className="text-xs text-white/40">{label}</p>
              <p className="mt-2 font-medium">{value}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/60">
              Core capabilities
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              What BiteShare offers
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="rounded-xl border border-white/10 bg-white/2.5 p-5 transition-colors hover:bg-white/5"
              >
                <span className="text-sm text-emerald-300/70">
                  {feature.number}
                </span>

                <h3 className="mt-5 font-medium">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Technologies */}
        <section className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/60">
              Technology stack
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Built with
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {technologies.map((technology) => (
              <span
                key={technology}
                className="rounded-lg border border-white/10 bg-white/4 px-4 py-2 text-sm text-white/70"
              >
                {technology}
              </span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-5 text-xs text-white/30">
          BiteShare — Project Overview
        </footer>
      </div>
    </div>
  );
}
