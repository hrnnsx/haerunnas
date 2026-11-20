
"use client";

import ApplicationWindow from "./ApplicationWindow";

import { getApplication } from "../registry";

import type { WindowInstance } from "./types";

interface ApplicationManagerProps {
  windows: WindowInstance[];
  onCloseWindow: (windowId: string) => void;
}

export default function ApplicationManager({
  windows,
  onCloseWindow,
}: ApplicationManagerProps) {
  const applicationWindows = windows.filter(
    (window) => window.type === "application" && !window.minimized
  );

  return (
    <>
      {applicationWindows.map((window) => {
        if (!window.applicationId || !window.viewId) {
          return null;
        }

        const application = getApplication(window.applicationId);

        if (!application) return null;

        const view = application.views.find(
          (item) => item.id === window.viewId
        );

        if (!view) return null;

        return (
          <ApplicationWindow
            key={window.id}
            application={application}
            view={view}
            window={window}
            onClose={onCloseWindow}
          />
        );
      })}
    </>
  );
}
