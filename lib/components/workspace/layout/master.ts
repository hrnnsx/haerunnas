
import type {
  LayoutCalculation,
  LayoutResult,
  DividerResult,
  WindowRect,
} from "./types";

const GOLDEN_RATIO = 0.618;
const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;

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
  stackRatios: number[];
}

function clampRatio(ratio: number): number {
  return Math.max(MIN_RATIO, Math.min(MAX_RATIO, ratio));
}

export function createMasterState(
  windowIds: string[]
): MasterState {
  return {
    masterId: windowIds[0] ?? null,
    stackIds: windowIds.slice(1),
    position: "left",
    ratio: GOLDEN_RATIO,
    stackRatios: [],
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
      stackRatios: state.stackRatios.slice(
        0,
        Math.max(0, remaining.length - 1)
      ),
    };
  }

  const nextStack = state.stackIds.filter(
    (id) => id !== windowId
  );

  return {
    ...state,
    stackIds: nextStack,
    stackRatios: state.stackRatios.slice(
      0,
      Math.max(0, nextStack.length - 1)
    ),
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
    stackRatios: [],
  };
}

export function resizeMasterRatio(
  state: MasterState,
  delta: number,
  parentSize: number
): MasterState {
  return {
    ...state,
    ratio: clampRatio(
      state.ratio + delta / Math.max(1, parentSize)
    ),
  };
}

export function resizeMasterStack(
  state: MasterState,
  index: number,
  delta: number,
  parentSize: number
): MasterState {
  const ratios = [...state.stackRatios];

  const currentRatio = ratios[index] ?? GOLDEN_RATIO;

  ratios[index] = clampRatio(
    currentRatio + delta / Math.max(1, parentSize)
  );

  return {
    ...state,
    stackRatios: ratios,
  };
}

export function calculateMasterLayout(
  state: MasterState,
  area: WindowRect,
  gap: number
): LayoutCalculation {
  const windows: LayoutResult[] = [];
  const dividers: DividerResult[] = [];

  const { masterId, stackIds, position, ratio } = state;

  if (!masterId) {
    return { windows, dividers };
  }

  if (stackIds.length === 0) {
    windows.push({
      windowId: masterId,
      rect: area,
    });

    return { windows, dividers };
  }

  const horizontal =
    position === "left" || position === "right";

  const parentSize = horizontal ? area.width : area.height;
  const available = Math.max(0, parentSize - gap);

  const masterSize = available * ratio;
  const stackSize = available - masterSize;

  const masterOnFirst =
    position === "left" || position === "top";

  const masterRect: WindowRect = horizontal
    ? {
        x: masterOnFirst
          ? area.x
          : area.x + stackSize + gap,
        y: area.y,
        width: masterSize,
        height: area.height,
      }
    : {
        x: area.x,
        y: masterOnFirst
          ? area.y
          : area.y + stackSize + gap,
        width: area.width,
        height: masterSize,
      };

  const stackRect: WindowRect = horizontal
    ? {
        x: masterOnFirst
          ? area.x + masterSize + gap
          : area.x,
        y: area.y,
        width: stackSize,
        height: area.height,
      }
    : {
        x: area.x,
        y: masterOnFirst
          ? area.y + masterSize + gap
          : area.y,
        width: area.width,
        height: stackSize,
      };

  windows.push({
    windowId: masterId,
    rect: masterRect,
  });

  dividers.push({
    id: "master",
    direction: horizontal ? "horizontal" : "vertical",
    rect: horizontal
      ? {
          x: area.x + (masterOnFirst ? masterSize : stackSize),
          y: area.y,
          width: gap,
          height: area.height,
        }
      : {
          x: area.x,
          y: area.y + (masterOnFirst ? masterSize : stackSize),
          width: area.width,
          height: gap,
        },
    parentSize,
  });

  // Stack dipecah bertingkat menggunakan golden ratio.
  function calculateStack(
    ids: string[],
    rect: WindowRect,
    index: number
  ) {
    if (ids.length === 0) return;

    if (ids.length === 1) {
      windows.push({
        windowId: ids[0],
        rect,
      });

      return;
    }

    const stackHorizontal = horizontal;
    const size = stackHorizontal ? rect.height : rect.width;
    const availableStack = Math.max(0, size - gap);

    const splitRatio =
      state.stackRatios[index] ?? GOLDEN_RATIO;

    const firstSize = availableStack * splitRatio;
    const secondSize = availableStack - firstSize;

    dividers.push({
      id: `stack:${index}`,
      direction: stackHorizontal ? "vertical" : "horizontal",
      rect: stackHorizontal
        ? {
            x: rect.x,
            y: rect.y + firstSize,
            width: rect.width,
            height: gap,
          }
        : {
            x: rect.x + firstSize,
            y: rect.y,
            width: gap,
            height: rect.height,
          },
      parentSize: size,
    });

    const firstRect: WindowRect = stackHorizontal
      ? {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: firstSize,
        }
      : {
          x: rect.x,
          y: rect.y,
          width: firstSize,
          height: rect.height,
        };

    const secondRect: WindowRect = stackHorizontal
      ? {
          x: rect.x,
          y: rect.y + firstSize + gap,
          width: rect.width,
          height: secondSize,
        }
      : {
          x: rect.x + firstSize + gap,
          y: rect.y,
          width: secondSize,
          height: rect.height,
        };

    windows.push({
      windowId: ids[0],
      rect: firstRect,
    });

    calculateStack(
      ids.slice(1),
      secondRect,
      index + 1
    );
  }

  calculateStack(stackIds, stackRect, 0);

  return {
    windows,
    dividers,
  };
}
