import type { ReactNode } from "react";

/** Small bordered label for technologies and skills. */
export default function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="border border-neutral-700 bg-[#0a0a0a]/70 px-2 py-0.5 text-xs text-neutral-300 backdrop-blur-sm">
      {children}
    </span>
  );
}