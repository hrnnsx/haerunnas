
import type {
  LayoutResult,
  WindowRect,
} from "./types";

export type MasterPosition =
  | "left"
  | "right"
  | "top"
  | "bottom";

export interface MasterState {
  masterId: string | null;
  stackIds: string[];
  position: MasterPosition;
  ratio: number;
}

export function createMasterState(
  windowIds: string[]
): MasterState {
  return {
    masterId: windowIds[0] ?? null,
    stackIds: windowIds.slice(1),
    position: "left",
    ratio: 0.55,
  };
}

export function addMasterWindow(
  state: MasterState,
  windowId: string
): MasterState {
  if (
    state.masterId === windowId ||
    state.stackIds.includes(windowId)
  ) {
    return state;
  }

  if (!state.masterId) {
    return {
      ...state,
      masterId: windowId,
    };
  }

  return {
    ...state,
    stackIds: [...state.stackIds, windowId],
  };
}

export function removeMasterWindow(
  state: MasterState,
  windowId: string
): MasterState {
  if (state.masterId === windowId) {
    const [nextMaster, ...remaining] = state.stackIds;

    return {
      ...state,
      masterId: nextMaster ?? null,
      stackIds: remaining,
    };
  }

  return {
    ...state,
    stackIds: state.stackIds.filter((id) => id !== windowId),
  };
}

export function promoteMasterWindow(
  state: MasterState,
  windowId: string
): MasterState {
  if (state.masterId === windowId) return state;

  const index = state.stackIds.indexOf(windowId);

  if (index === -1) return state;

  const previousMaster = state.masterId;

  const nextStack = state.stackIds.filter(
    (id) => id !== windowId
  );

  if (previousMaster) {
    nextStack.unshift(previousMaster);
  }

  return {
    ...state,
    masterId: windowId,
    stackIds: nextStack,
  };
}

export function calculateMasterLayout(
  state: MasterState,
  area: WindowRect,
  gap: number
): LayoutResult[] {
  const results: LayoutResult[] = [];

  const { masterId, stackIds, position, ratio } = state;

  if (!masterId) return results;

  if (stackIds.length === 0) {
    return [
      {
        windowId: masterId,
        rect: area,
      },
    ];
  }

  const horizontal =
    position === "left" || position === "right";

  const available = Math.max(
    0,
    (horizontal ? area.width : area.height) - gap
  );

  const masterSize = available * ratio;
  const stackSize = available - masterSize;

  let masterRect: WindowRect;
  let stackRect: WindowRect;

  if (horizontal) {
    const masterOnLeft = position === "left";

    masterRect = {
      x: masterOnLeft
        ? area.x
        : area.x + stackSize + gap,
      y: area.y,
      width: masterSize,
      height: area.height,
    };

    stackRect = {
      x: masterOnLeft
        ? area.x + masterSize + gap
        : area.x,
      y: area.y,
      width: stackSize,
      height: area.height,
    };
  } else {
    const masterOnTop = position === "top";

    masterRect = {
      x: area.x,
      y: masterOnTop
        ? area.y
        : area.y + stackSize + gap,
      width: area.width,
      height: masterSize,
    };

    stackRect = {
      x: area.x,
      y: masterOnTop
        ? area.y + masterSize + gap
        : area.y,
      width: area.width,
      height: stackSize,
    };
  }

  results.push({
    windowId: masterId,
    rect: masterRect,
  });

  const stackGap = gap * (stackIds.length - 1);

  const stackItemSize =
    Math.max(
      0,
      (horizontal ? stackRect.height : stackRect.width) -
        stackGap
    ) / stackIds.length;

  stackIds.forEach((windowId, index) => {
    const rect: WindowRect = horizontal
      ? {
          x: stackRect.x,
          y: stackRect.y + index * (stackItemSize + gap),
          width: stackRect.width,
          height: stackItemSize,
        }
      : {
          x: stackRect.x + index * (stackItemSize + gap),
          y: stackRect.y,
          width: stackItemSize,
          height: stackRect.height,
        };

    results.push({ windowId, rect });
  });

  return results;
}
