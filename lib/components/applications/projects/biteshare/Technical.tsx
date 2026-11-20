
export default function BiteShareTechnical() {
  const technologies = [
    {
      category: "Backend",
      items: ["Go", "Gin Framework", "GORM"],
    },
    {
      category: "Database",
      items: ["PostgreSQL", "Supabase", "pgx"],
    },
    {
      category: "Infrastructure & Services",
      items: ["Docker", "ImageKit", "Resend"],
    },
    {
      category: "Authentication",
      items: ["JWT", "bcrypt"],
    },
  ];

  const services = [
    {
      number: "01",
      name: "Donation API",
      description:
        "Handles donation submissions, administrative reviews, and pickup scheduling.",
      port: "8081",
    },
    {
      number: "02",
      name: "E-Commerce API",
      description:
        "Handles the product catalog, inventory, and e-commerce operations.",
      port: "Separate service",
    },
  ];

  const newLocal = "rounded-xl border border-sky-400/20 bg-sky-400/5 p-5 text-center";
  return (
    <div className="h-full overflow-y-auto bg-[#0b0b0f] text-white">
      <div className="mx-auto max-w-6xl space-y-12 p-6 md:p-10">

        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/60">
            Technical Documentation
          </p>

          <h1 className="text-2xl font-semibold">
            System Architecture
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/40">
            An overview of BiteShare's backend architecture,
            service boundaries, and supporting technologies.
          </p>
        </header>

        {/* Architecture */}
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold">
              Architecture Overview
            </h2>
            <p className="mt-1 text-xs text-white/40">
              Two independent API services using a shared database.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/2 p-5 md:p-8">
            <div className="mx-auto max-w-xl space-y-3">

              <div className="rounded-xl border border-white/10 bg-white/4 p-4 text-center">
                <p className="text-xs text-white/40">Client Layer</p>
                <p className="mt-1 font-medium">
                  Web Application / Admin
                </p>
              </div>

              <div className="flex justify-center">
                <div className="h-6 w-px bg-white/20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {services.map((service) => (
                  <div
                    key={service.number}
                    className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4"
                  >
                    <span className="text-xs text-emerald-300/60">
                      SERVICE {service.number}
                    </span>

                    <h3 className="mt-3 text-sm font-semibold">
                      {service.name}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-white/40">
                      {service.description}
                    </p>

                    <p className="mt-4 text-[10px] text-white/30">
                      {service.port}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <div className="h-6 w-px bg-white/20" />
              </div>

              <div className={newLocal}>
                <p className="text-xs text-sky-300/60">
                  SHARED DATA LAYER
                </p>
                <h3 className="mt-2 font-semibold">
                  PostgreSQL
                </h3>
                <p className="mt-1 text-xs text-white/40">
                  Hosted with Supabase
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">
            Backend Services
          </h2>

          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.number}
                className="rounded-xl border border-white/10 bg-white/2.5 p-5"
              >
                <span className="text-xs text-emerald-300/60">
                  SERVICE {service.number}
                </span>
                <h3 className="mt-3 font-semibold">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Technologies */}
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">
            Technology Stack
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {technologies.map((technology) => (
              <div
                key={technology.category}
                className="rounded-xl border border-white/10 bg-white/2.5 p-5"
              >
                <h3 className="text-sm font-medium">
                  {technology.category}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {technology.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white/60"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Implementation details */}
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">
            Implementation Highlights
          </h2>

          <div className="space-y-3">
            {[
              [
                "Shared Authentication",
                "Administrator authentication uses JWT, with password hashes managed using bcrypt.",
              ],
              [
                "Image Management",
                "Donation photos are uploaded to ImageKit, while image references are stored in the database.",
              ],
              [
                "Email Notifications",
                "Resend is used for donation status and pickup schedule notifications.",
              ],
              [
                "Service Separation",
                "Donation and e-commerce APIs have separate entry points while sharing the PostgreSQL database.",
              ],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/2.5 p-5"
              >
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 pt-5 text-xs text-white/30">
          BiteShare — Technical Overview
        </footer>
      </div>
    </div>
  );
}
