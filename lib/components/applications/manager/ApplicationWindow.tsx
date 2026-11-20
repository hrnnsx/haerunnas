
"use client";

import type { ApplicationDefinition, ApplicationView } from "../types";
import type { WindowInstance } from "./types";

interface ApplicationWindowProps {
  application: ApplicationDefinition;
  view: ApplicationView;
  window: WindowInstance;
  onClose: (windowId: string) => void;
}

export default function ApplicationWindow({
  application,
  view,
  window,
  onClose,
}: ApplicationWindowProps) {
  const ViewComponent = view.component;

  return (
    <section
      className="
        flex h-full min-h-0 min-w-0 flex-col
        overflow-hidden rounded-xl
        border border-white/10
        bg-[#0b0b0f]/95 text-white
      "
      data-window-id={window.id}
    >
      <header
        className="
          flex shrink-0 items-center justify-between gap-4
          border-b border-white/10
          px-4 py-3
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
            <img
              src={`/icons/${application.icon}.svg`}
              alt=""
              className="h-5 w-5"
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">
              {application.name}
              <span className="ml-2 font-normal text-white/40">
                / {view.name}
              </span>
            </h2>

            <p className="truncate text-xs text-white/40">
              {application.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onClose(window.id)}
          aria-label={`Close ${application.name} ${view.name}`}
          title="Close window"
          className="
            flex h-7 w-7 shrink-0 items-center justify-center
            rounded-md text-white/40
            transition-colors
            hover:bg-red-500/15 hover:text-red-400
          "
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <main className="min-h-0 min-w-0 flex-1 overflow-auto">
        <ViewComponent />
      </main>
    </section>
  );
}
