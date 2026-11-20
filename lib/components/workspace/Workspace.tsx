
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ReactNode, PointerEvent } from "react";
import type { WindowInstance } from "../applications/manager/types";

import WindowFrame from "@/lib/components/workspace/WindowFrame";

import type {
  LayoutNode,
  LayoutMode,
  WindowRect,
  DividerResult,
} from "./layout/types";

import {
  createLeaf,
  getWindowIds,
  insertWindow,
  removeWindow,
  resizeSplit,
  swapWindows,
  calculateDwindleLayout,
} from "./layout/dwindle";

import {
  createMasterState,
  addMasterWindow,
  removeMasterWindow,
  promoteMasterWindow,
  calculateMasterLayout,
  resizeMasterRatio,
  resizeMasterStack,
} from "./layout/master";

import "./workspace.css";

interface WorkspaceProps {
  windows: WindowInstance[];
  booted: boolean;
  renderWindow: (window: WindowInstance) => ReactNode;
  onCloseWindow: (windowId: string) => void;
}

interface ResizeDividerProps {
  divider: DividerResult;
  onResize: (deltaX: number, deltaY: number) => void;
}

function ResizeDivider({
  divider,
  onResize,
}: ResizeDividerProps) {
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

  const horizontal = divider.direction === "horizontal";

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className={`
        absolute z-50 touch-none
        ${horizontal
          ? "cursor-col-resize"
          : "cursor-row-resize"
        }
      `}
      style={{
        left: divider.rect.x,
        top: divider.rect.y,
        width: divider.rect.width,
        height: divider.rect.height,
      }}
    >
      <div
        className={`
          absolute rounded-full bg-white/0
          transition-colors duration-150
          hover:bg-white/25
          ${horizontal
            ? "inset-y-0 left-1/2 w-1 -translate-x-1/2"
            : "inset-x-0 top-1/2 h-1 -translate-y-1/2"
          }
        `}
      />
    </div>
  );
}

const DEFAULT_GAP = 12;
const OUTER_GAP = 16;

export default function Workspace({
  windows,
  booted,
  renderWindow,
  onCloseWindow,
}: WorkspaceProps) {
  const workspaceRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  const [mode, setMode] = useState<LayoutMode>("dwindle");

  const [focusedId, setFocusedId] = useState(
    "system:terminal"
  );

  const [tree, setTree] = useState<LayoutNode | null>(() =>
    createLeaf("system:terminal")
  );

  const [masterState, setMasterState] = useState(() =>
    createMasterState(["system:terminal"])
  );

  const visibleWindows = useMemo(
    () => windows.filter((window) => !window.minimized),
    [windows]
  );

  const visibleIds = useMemo(
    () => visibleWindows.map((window) => window.id),
    [visibleWindows]
  );

  // Measure workspace.
  useEffect(() => {
    const element = workspaceRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Synchronize Dwindle and Master layouts.
  useEffect(() => {
    setTree((current) => {
      let next = current;

      const existing = getWindowIds(next);

      for (const id of existing) {
        if (!visibleIds.includes(id)) {
          next = removeWindow(next, id);
        }
      }

      for (const id of visibleIds) {
        if (!getWindowIds(next).includes(id)) {
          next = insertWindow(next, id);
        }
      }

      return next;
    });

    setMasterState((current) => {
      let next = current;

      const existing = [
        next.masterId,
        ...next.stackIds,
      ].filter(Boolean) as string[];

      for (const id of existing) {
        if (!visibleIds.includes(id)) {
          next = removeMasterWindow(next, id);
        }
      }

      for (const id of visibleIds) {
        next = addMasterWindow(next, id);
      }

      return next;
    });
  }, [visibleIds]);

  const area: WindowRect = {
    x: OUTER_GAP,
    y: OUTER_GAP,
    width: Math.max(0, size.width - OUTER_GAP * 2),
    height: Math.max(0, size.height - OUTER_GAP * 2),
  };

  const layout = useMemo(() => {
    if (mode === "dwindle") {
      return calculateDwindleLayout(
        tree,
        area,
        DEFAULT_GAP
      );
    }

    return calculateMasterLayout(
      masterState,
      area,
      DEFAULT_GAP
    );
  }, [
    mode,
    tree,
    masterState,
    size.width,
    size.height,
  ]);

  const layoutById = useMemo(
    () =>
      new Map(
        layout.windows.map((result) => [
          result.windowId,
          result.rect,
        ])
      ),
    [layout.windows]
  );

  // Swap windows. Existing behavior is preserved.
  const swapWindow = useCallback(
    (sourceId: string, targetId: string) => {
      if (mode === "dwindle") {
        setTree((current) =>
          current
            ? swapWindows(current, sourceId, targetId)
            : current
        );

        return;
      }

      setMasterState((current) => {
        if (sourceId === current.masterId) {
          return promoteMasterWindow(current, targetId);
        }

        if (targetId === current.masterId) {
          return promoteMasterWindow(current, sourceId);
        }

        const ids = [...current.stackIds];
        const first = ids.indexOf(sourceId);
        const second = ids.indexOf(targetId);

        if (first === -1 || second === -1) return current;

        [ids[first], ids[second]] = [
          ids[second],
          ids[first],
        ];

        return {
          ...current,
          stackIds: ids,
        };
      });
    },
    [mode]
  );

  // Resize the exact divider being dragged.
  const resizeDivider = useCallback(
    (
      divider: DividerResult,
      deltaX: number,
      deltaY: number
    ) => {
      const delta =
        divider.direction === "horizontal"
          ? deltaX
          : deltaY;

      if (Math.abs(delta) < 0.01) return;

      if (mode === "dwindle") {
        setTree((current) => {
          if (!current) return current;

          return resizeSplit(
            current,
            divider.id,
            delta,
            divider.parentSize
          );
        });

        return;
      }

      if (divider.id === "master") {
        const masterOnFirst =
          masterState.position === "left" ||
          masterState.position === "top";

        setMasterState((current) =>
          resizeMasterRatio(
            current,
            masterOnFirst ? delta : -delta,
            divider.parentSize
          )
        );

        return;
      }

      if (divider.id.startsWith("stack:")) {
        const index = Number(
          divider.id.replace("stack:", "")
        );

        setMasterState((current) =>
          resizeMasterStack(
            current,
            index,
            delta,
            divider.parentSize
          )
        );
      }
    },
    [mode, masterState.position]
  );

  const terminal = windows.find(
    (window) => window.type === "terminal"
  );

  return (
    <div
      ref={workspaceRef}
      className="workspace"
    >
      {booted && (
        <div className="workspace-controls">
          <button
            type="button"
            onClick={() => setMode("dwindle")}
            data-active={mode === "dwindle"}
          >
            Dwindle
          </button>

          <button
            type="button"
            onClick={() => setMode("master")}
            data-active={mode === "master"}
          >
            Master
          </button>

          {mode === "master" && (
            <button
              type="button"
              onClick={() =>
                setMasterState((current) => ({
                  ...current,
                  position:
                    current.position === "left"
                      ? "right"
                      : current.position === "right"
                        ? "top"
                        : current.position === "top"
                          ? "bottom"
                          : "left",
                }))
              }
            >
              Rotate
            </button>
          )}
        </div>
      )}

      {visibleWindows.map((window) => {
        if (!booted && window.type !== "terminal") {
          return null;
        }

        const rect = booted
          ? layoutById.get(window.id)
          : {
              x: 0,
              y: 0,
              width: size.width,
              height: size.height,
            };

        if (!rect) return null;

        return (
          <WindowFrame
            key={window.id}
            windowId={window.id}
            title={
              window.type === "terminal"
                ? "Terminal"
                : `${window.applicationId} / ${window.viewId}`
            }
            rect={rect}
            focused={focusedId === window.id}
            terminal={window.type === "terminal"}
            hideHeader={!booted && window.type === "terminal"}
            onFocus={() => setFocusedId(window.id)}
            onClose={() => onCloseWindow(window.id)}
            onDropWindow={(sourceId) =>
              swapWindow(sourceId, window.id)
            }
          >
            {renderWindow(window)}
          </WindowFrame>
        );
      })}

      {booted &&
        layout.dividers.map((divider) => (
          <ResizeDivider
            key={divider.id}
            divider={divider}
            onResize={(deltaX, deltaY) =>
              resizeDivider(divider, deltaX, deltaY)
            }
          />
        ))}
    </div>
  );
}
