
"use client";

import type { ReactNode } from "react";

import type { WindowRect } from "./layout/types";

interface WindowFrameProps {
  windowId: string;
  title: string;
  rect: WindowRect;
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onDropWindow: (sourceId: string) => void;
  children: ReactNode;
  terminal?: boolean;
  hideHeader?: boolean;
}

export default function WindowFrame({
  windowId,
  title,
  rect,
  focused,
  onFocus,
  onClose,
  onDropWindow,
  children,
  terminal = false,
  hideHeader = false,
}: WindowFrameProps) {
  return (
    <section
      data-window-id={windowId}
      onMouseDown={onFocus}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();

        const sourceId =
          event.dataTransfer.getData("text/plain");

        if (sourceId && sourceId !== windowId) {
          onDropWindow(sourceId);
        }
      }}
      className={`
        absolute flex flex-col overflow-hidden
        ${hideHeader ? "" : "rounded-xl border bg-[#0b0b0f]/95"}
        ${
          focused && !hideHeader
            ? "border-white/35 shadow-lg shadow-black/30"
            : "border-white/10"
        }
      `}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    >
      {!hideHeader && (
        <header
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(
              "text/plain",
              windowId
            );

            event.dataTransfer.effectAllowed = "move";
            onFocus();
          }}
          className="
            flex h-11 shrink-0 cursor-grab
            items-center justify-between
            border-b border-white/10 px-4
            active:cursor-grabbing
          "
        >
          <span className="truncate text-xs font-medium text-white">
            {title}
          </span>

          {terminal ? (
            <span className="text-[10px] text-white/30">
              SYSTEM
            </span>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="
                flex h-6 w-6 items-center justify-center
                rounded-md text-white/40
                hover:bg-red-500/15 hover:text-red-400
              "
              aria-label={`Close ${title}`}
            >
              ×
            </button>
          )}
        </header>
      )}

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {children}
      </div>
    </section>
  );
}
