
export type WindowType = "terminal" | "application";

export interface WindowConstraints {
  minWidth: number;
  minHeight: number;
}

export interface WindowInstance {
  id: string;
  type: WindowType;

  applicationId?: string;
  viewId?: string;

  constraints: WindowConstraints;

  minimized: boolean;
}

export const TERMINAL_WINDOW_ID = "system:terminal";

export const DEFAULT_WINDOW_CONSTRAINTS: WindowConstraints = {
  minWidth: 320,
  minHeight: 240,
};

export const TERMINAL_WINDOW_CONSTRAINTS: WindowConstraints = {
  minWidth: 420,
  minHeight: 280,
};

export function createTerminalWindow(): WindowInstance {
  return {
    id: TERMINAL_WINDOW_ID,
    type: "terminal",
    constraints: TERMINAL_WINDOW_CONSTRAINTS,
    minimized: false,
  };
}

export function createApplicationWindow(
  applicationId: string,
  viewId: string,
  constraints: WindowConstraints = DEFAULT_WINDOW_CONSTRAINTS
): WindowInstance {
  return {
    id: `${applicationId}:${viewId}`,
    type: "application",
    applicationId,
    viewId,
    constraints,
    minimized: false,
  };
}
