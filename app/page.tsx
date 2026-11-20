
"use client";

import { useCallback, useState } from "react";

import Butterflies from "@/lib/components/Butterflies";
import Terminal from "@/lib/components/terminal/Terminal";

import Workspace from "@/lib/components/workspace/Workspace";

import {
  getApplication,
} from "@/lib/components/applications/registry";

import {
  createApplicationWindow,
  createTerminalWindow,
  TERMINAL_WINDOW_ID,
} from "@/lib/components/applications/manager/types";

import type {
  WindowInstance,
} from "@/lib/components/applications/manager/types";

import type {
  FileSystemNode,
} from "@/lib/components/terminal/filesystem/types";

import {
  HOME_PATH,
} from "@/lib/components/terminal/filesystem/data";

export default function Home() {
  const [currentDirectory, setCurrentDirectory] = useState(HOME_PATH);
  const [booted, setBooted] = useState(false);

  const [windows, setWindows] = useState<WindowInstance[]>(() => [
    createTerminalWindow(),
  ]);

  const openApplication = useCallback((node: FileSystemNode) => {
    if (node.type !== "application" || !node.workspaceId) {
      return;
    }

    const application = getApplication(
      node.workspaceId.toLowerCase()
    );

    if (!application) return;

    setWindows((current) => {
      const existingIds = new Set(
        current.map((window) => window.id)
      );

      const newWindows = application.views
        .map((view) =>
          createApplicationWindow(application.id, view.id)
        )
        .filter((window) => !existingIds.has(window.id));

      return [...current, ...newWindows];
    });
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    if (windowId === TERMINAL_WINDOW_ID) return;

    setWindows((current) =>
      current.filter((window) => window.id !== windowId)
    );
  }, []);

  const renderWindow = useCallback(
    (window: WindowInstance) => {
      if (window.type === "terminal") {
        return (
          <Terminal
            onBootStart={() => setBooted(false)}
            onBootComplete={() => setBooted(true)}
            currentDirectory={currentDirectory}
            onDirectoryChange={setCurrentDirectory}
            onOpenApplication={openApplication}
          />
        );
      }

      if (!window.applicationId || !window.viewId) {
        return null;
      }

      const application = getApplication(window.applicationId);

      if (!application) return null;

      const view = application.views.find(
        (item) => item.id === window.viewId
      );

      if (!view) return null;

      const ViewComponent = view.component;

      return <ViewComponent />;
    },
    [currentDirectory, openApplication]
  );

  return (
    <main className="
      relative h-dvh min-h-100 w-full
      overflow-hidden bg-[#08080c] text-white
    ">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Butterflies
          theme="dark"
          white={1}
          butterflyOpacity={1}
          density={0.4}
        />
      </div>

      <Workspace
        windows={windows}
        booted={booted}
        renderWindow={renderWindow}
        onCloseWindow={closeWindow}
      />
    </main>
  );
}
