
interface PreBootProps {
  visible: boolean;
}

export default function PreBoot({ visible }: PreBootProps) {
  return (
    <div
      className={`
        fixed inset-0 z-10
        flex items-center justify-center
        px-6
        transition-all duration-700
        ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-3 pointer-events-none"
        }
      `}
    >
      <div className="w-full max-w-xl space-y-8">
        <header>
          <h1 className="text-4xl font-semibold tracking-tight">
            Haerunnas.
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Personal Computing Environment
          </p>
        </header>

        <div className="border-y border-white/10 py-5 space-y-3">
          <p className="text-xs text-neutral-500 font-mono">
            SYSTEM STATUS
          </p>

          {[
            ["Environment", "Standby"],
            ["Shell", "haerunnas-shell"],
            ["Version", "1.0.0"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-neutral-500">{label}</span>
              <span className="text-neutral-300">{value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-600 font-mono">
          PERSONAL ENVIRONMENT / 2026
        </p>
      </div>
    </div>
  );
}
