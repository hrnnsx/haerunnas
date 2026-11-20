
"use client";

import { useRef } from "react";
import type { ReactNode, PointerEvent } from "react";

import type { WindowRect } from "./layout/types";

interface WindowFrameProps {
  windowId: string;
  title: string;
  rect: WindowRect;
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onDropWindow: (sourceId: string) => void;
  onResize: (deltaX: number, deltaY: number) => void;
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
  onResize,
  children,
  terminal = false,
  hideHeader = false,
}: WindowFrameProps) {
  const pointerRef = useRef({
    active: false,
    x: 0,
    y: 0,
  });

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    pointerRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (!pointerRef.current.active) return;

    const deltaX = event.clientX - pointerRef.current.x;
    const deltaY = event.clientY - pointerRef.current.y;

    pointerRef.current.x = event.clientX;
    pointerRef.current.y = event.clientY;

    onResize(deltaX, deltaY);
  };

  const handlePointerEnd = () => {
    pointerRef.current.active = false;
  };

  return (
    <section
      data-window-id={windowId}
      onMouseDown={onFocus}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();

        const sourceId = event.dataTransfer.getData("text/plain");

        if (sourceId && sourceId !== windowId) {
          onDropWindow(sourceId);
        }
      }}
      className={`
        absolute overflow-hidden
        ${hideHeader ? "" : "rounded-xl border bg-[#0b0b0f]/95"}
        ${focused && !hideHeader
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
            event.dataTransfer.setData("text/plain", windowId);
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

      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={{
          height: hideHeader ? "100%" : "calc(100% - 44px)",
        }}
      >
        {children}
      </div>

      {!hideHeader && !terminal && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className="
            absolute bottom-0 right-0 z-20
            h-5 w-5 cursor-nwse-resize
            touch-none
          "
        >
          <div className="absolute bottom-1 right-1 h-2 w-2 rounded-sm border-b-2 border-r-2 border-white/30" />
        </div>
      )}
    </section>
  );
}
