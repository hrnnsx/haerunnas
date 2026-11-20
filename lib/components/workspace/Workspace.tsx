
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { WindowInstance } from "../applications/manager/types";

import WindowFrame from "@/lib/components/workspace/WindowFrame";

import type {
  LayoutNode,
  LayoutMode,
  WindowRect,
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
} from "./layout/master";

import "./workspace.css";

interface WorkspaceProps {
  windows: WindowInstance[];
  booted: boolean;
  renderWindow: (window: WindowInstance) => ReactNode;
  onCloseWindow: (windowId: string) => void;
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

  // Measure workspace dimensions.
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

  // Keep layout synchronized with window state.
  useEffect(() => {
    setTree((current) => {
      let next = current;

      const existing = getWindowIds(next);
      const removed = existing.filter(
        (id) => !visibleIds.includes(id)
      );

      for (const id of removed) {
        next = removeWindow(next, id);
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

  const layoutResults = useMemo(() => {
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
  }, [mode, tree, masterState, size.width, size.height]);

  const layoutById = useMemo(
    () =>
      new Map(
        layoutResults.map((result) => [
          result.windowId,
          result.rect,
        ])
      ),
    [layoutResults]
  );

  const swapWindow = useCallback(
    (sourceId: string, targetId: string) => {
      if (mode === "dwindle") {
        setTree((current) =>
          current
            ? swapWindows(current, sourceId, targetId)
            : current
        );
      } else {
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
      }
    },
    [mode]
  );

  const resizeWindow = useCallback(
    (windowId: string, deltaX: number, deltaY: number) => {
      if (mode === "dwindle") {
        setTree((current) => {
          if (!current) return current;

          const rect = layoutById.get(windowId);
          if (!rect) return current;

          const delta =
            rect.width >= rect.height
              ? deltaX / Math.max(1, size.width)
              : deltaY / Math.max(1, size.height);

          return resizeSplit(current, windowId, delta);
        });
      } else {
        setMasterState((current) => ({
          ...current,
          ratio: Math.max(
            0.2,
            Math.min(
              0.8,
              current.ratio +
                (current.position === "left" ||
                current.position === "right"
                  ? deltaX / Math.max(1, size.width)
                  : deltaY / Math.max(1, size.height))
            )
          ),
        }));
      }
    },
    [mode, layoutById, size]
  );

  // Before boot, render the same terminal instance full-screen.
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
            onResize={(deltaX, deltaY) =>
              resizeWindow(window.id, deltaX, deltaY)
            }
          >
            {renderWindow(window)}
          </WindowFrame>
        );
      })}
    </div>
  );
}
