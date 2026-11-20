
import type {
  LayoutNode,
  LayoutResult,
  SplitDirection,
  WindowRect,
} from "./types";

const DEFAULT_RATIO = 0.5;
const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;

export function createLeaf(windowId: string): LayoutNode {
  return {
    type: "window",
    windowId,
  };
}

export function getWindowIds(
  node: LayoutNode | null
): string[] {
  if (!node) return [];

  if (node.type === "window") {
    return [node.windowId];
  }

  return [
    ...getWindowIds(node.first),
    ...getWindowIds(node.second),
  ];
}

function clampRatio(ratio: number) {
  return Math.max(MIN_RATIO, Math.min(MAX_RATIO, ratio));
}

function getAutomaticDirection(
  rect: WindowRect
): SplitDirection {
  return rect.width >= rect.height
    ? "horizontal"
    : "vertical";
}

function findLeaf(
  node: LayoutNode,
  windowId: string
): boolean {
  if (node.type === "window") {
    return node.windowId === windowId;
  }

  return (
    findLeaf(node.first, windowId) ||
    findLeaf(node.second, windowId)
  );
}

export function insertWindow(
  root: LayoutNode | null,
  windowId: string,
  targetId?: string,
  direction?: SplitDirection
): LayoutNode {
  if (!root) return createLeaf(windowId);

  if (getWindowIds(root).includes(windowId)) {
    return root;
  }

  const target = targetId ?? getWindowIds(root).at(-1);

  if (!target || !findLeaf(root, target)) {
    return {
      type: "split",
      direction: "horizontal",
      ratio: DEFAULT_RATIO,
      first: root,
      second: createLeaf(windowId),
    };
  }

  function replace(node: LayoutNode): LayoutNode {
    if (node.type === "window") {
      if (node.windowId !== target) return node;

      return {
        type: "split",
        direction: direction ?? "horizontal",
        ratio: DEFAULT_RATIO,
        first: node,
        second: createLeaf(windowId),
      };
    }

    return {
      ...node,
      first: replace(node.first),
      second: replace(node.second),
    };
  }

  return replace(root);
}

export function removeWindow(
  node: LayoutNode | null,
  windowId: string
): LayoutNode | null {
  if (!node) return null;

  if (node.type === "window") {
    return node.windowId === windowId ? null : node;
  }

  const first = removeWindow(node.first, windowId);
  const second = removeWindow(node.second, windowId);

  if (!first) return second;
  if (!second) return first;

  return {
    ...node,
    first,
    second,
  };
}

export function swapWindows(
  node: LayoutNode,
  firstId: string,
  secondId: string
): LayoutNode {
  if (firstId === secondId) return node;

  function visit(current: LayoutNode): LayoutNode {
    if (current.type === "window") {
      if (current.windowId === firstId) {
        return createLeaf(secondId);
      }

      if (current.windowId === secondId) {
        return createLeaf(firstId);
      }

      return current;
    }

    return {
      ...current,
      first: visit(current.first),
      second: visit(current.second),
    };
  }

  return visit(node);
}


export function resizeSplit(
  node: LayoutNode,
  targetId: string,
  delta: number
): LayoutNode {
  if (node.type === "window") return node;

  const contains = (current: LayoutNode): boolean => {
    if (current.type === "window") {
      return current.windowId === targetId;
    }

    return (
      contains(current.first) ||
      contains(current.second)
    );
  };

  const firstHas = contains(node.first);
  const secondHas = contains(node.second);

  if (!firstHas && !secondHas) return node;

  // Continue deeper if the target belongs to a nested split.
  if (firstHas && node.first.type === "split") {
    return {
      ...node,
      first: resizeSplit(node.first, targetId, delta),
    };
  }

  if (secondHas && node.second.type === "split") {
    return {
      ...node,
      second: resizeSplit(node.second, targetId, delta),
    };
  }

  // This is the nearest split controlling the target leaf.
  return {
    ...node,
    ratio: clampRatio(
      node.ratio + (firstHas ? delta : -delta)
    ),
  };
}


export function calculateDwindleLayout(
  root: LayoutNode | null,
  rect: WindowRect,
  gap: number
): LayoutResult[] {
  if (!root) return [];

  const results: LayoutResult[] = [];

  function calculate(
    node: LayoutNode,
    area: WindowRect
  ) {
    if (node.type === "window") {
      results.push({
        windowId: node.windowId,
        rect: area,
      });

      return;
    }

    const horizontal = node.direction === "horizontal";
    const available = Math.max(
      0,
      (horizontal ? area.width : area.height) - gap
    );

    const firstSize = available * node.ratio;
    const secondSize = available - firstSize;

    if (horizontal) {
      calculate(node.first, {
        x: area.x,
        y: area.y,
        width: firstSize,
        height: area.height,
      });

      calculate(node.second, {
        x: area.x + firstSize + gap,
        y: area.y,
        width: secondSize,
        height: area.height,
      });
    } else {
      calculate(node.first, {
        x: area.x,
        y: area.y,
        width: area.width,
        height: firstSize,
      });

      calculate(node.second, {
        x: area.x,
        y: area.y + firstSize + gap,
        width: area.width,
        height: secondSize,
      });
    }
  }

  calculate(root, rect);

  return results;
}

export function getSplitDirection(
  width: number,
  height: number
): SplitDirection {
  return getAutomaticDirection({ x: 0, y: 0, width, height });
}
