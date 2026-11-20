export default function BiteSharePreview() {
  const donations = [
    {
      name: "Nasi Kotak",
      donor: "Restaurant A",
      quantity: "25 boxes",
      status: "Approved",
      color: "text-emerald-300",
      background: "bg-emerald-400/10",
    },
    {
      name: "Fresh Bread",
      donor: "Bakery B",
      quantity: "40 pcs",
      status: "Pending",
      color: "text-amber-300",
      background: "bg-amber-400/10",
    },
    {
      name: "Vegetables",
      donor: "Market C",
      quantity: "15 kg",
      status: "Scheduled",
      color: "text-sky-300",
      background: "bg-sky-400/10",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0b0b0f] p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/60">
            Project Preview
          </p>

          <h1 className="text-2xl font-semibold">
            BiteShare Interface
          </h1>

          <p className="text-sm text-white/40">
            An illustrative look at the donation management experience.
          </p>
        </header>

        {/* Browser mockup */}
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#111116] shadow-2xl">

          {/* Browser topbar */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/2.5 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />

            <div className="ml-4 flex-1 rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-center text-xs text-white/30">
              dashboard.biteshare.local
            </div>
          </div>

          <div className="flex min-h-110">

            {/* Sidebar */}
            <aside className="hidden w-48 shrink-0 border-r border-white/10 bg-black/20 p-4 sm:block">
              <div className="mb-8 flex items-center gap-2">
                <span className="text-xl">🍱</span>
                <span className="font-semibold">BiteShare</span>
              </div>

              <p className="mb-3 text-[10px] uppercase tracking-widest text-white/30">
                Workspace
              </p>

              <div className="space-y-1 text-sm">
                {[
                  ["▦", "Dashboard", true],
                  ["◇", "Donations", false],
                  ["□", "Inventory", false],
                  ["↗", "Orders", false],
                  ["⚙", "Settings", false],
                ].map(([icon, label, active]) => (
                  <div
                    key={String(label)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                      active
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "text-white/40"
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <div className="min-w-0 flex-1 space-y-6 p-5 md:p-7">
              <div>
                <p className="text-xs text-white/40">
                  Monday, November 2026
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Dashboard
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Here's an overview of your platform.
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {[
                  ["Total Donations", "128", "+12%"],
                  ["Pending Requests", "08", "Needs review"],
                  ["Available Products", "34", "In inventory"],
                ].map(([label, value, detail]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/10 bg-white/2.5 p-4"
                  >
                    <p className="text-xs text-white/40">{label}</p>
                    <p className="mt-3 text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-[10px] text-emerald-300/70">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Donation table */}
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                  <h3 className="text-sm font-medium">
                    Recent Donations
                  </h3>
                  <span className="text-xs text-emerald-300">
                    View all
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {donations.map((donation) => (
                    <div
                      key={donation.name}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {donation.name}
                        </p>
                        <p className="mt-1 text-xs text-white/35">
                          {donation.donor} · {donation.quantity}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] ${donation.color} ${donation.background}`}
                      >
                        {donation.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-center text-[10px] text-white/25">
                Illustrative interface — sample data only
              </p>
            </div>
          </div>
        </section>

        {/* Flow */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Platform Workflow
          </h2>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["01", "Donation", "Donor submits food information."],
              ["02", "Review", "Admin reviews the request."],
              ["03", "Pickup", "Pickup is scheduled and completed."],
              ["04", "E-Commerce", "Processed products enter inventory."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-xl border border-white/10 bg-white/2.5 p-4"
              >
                <span className="text-xs text-emerald-300/60">
                  {number}
                </span>
                <h3 className="mt-3 text-sm font-medium">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/40">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
