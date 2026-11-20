
import type {
  LayoutNode,
  LayoutResult,
  DividerResult,
  LayoutCalculation,
  SplitDirection,
  WindowRect,
} from "./types";

const GOLDEN_RATIO = 0.618;
const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;

export function createLeaf(windowId: string): LayoutNode {
  return {
    type: "window",
    windowId,
  };
}

export function getWindowIds(node: LayoutNode | null): string[] {
  if (!node) return [];

  if (node.type === "window") {
    return [node.windowId];
  }

  return [
    ...getWindowIds(node.first),
    ...getWindowIds(node.second),
  ];
}

function clampRatio(ratio: number): number {
  return Math.max(MIN_RATIO, Math.min(MAX_RATIO, ratio));
}

function createSplit(
  direction: SplitDirection,
  first: LayoutNode,
  second: LayoutNode,
  ratio = GOLDEN_RATIO
): LayoutNode {
  return {
    type: "split",
    direction,
    ratio: clampRatio(ratio),
    first,
    second,
  };
}

/**
 * Struktur kolom:
 *
 * Horizontal split:
 * [Column 1] | [Column 2] | [Column 3]
 *
 * Setiap column berisi vertical split:
 * [Row 1]
 * [Row 2]
 * [Row 3]
 */

function extractColumns(root: LayoutNode): LayoutNode[] {
  if (
    root.type === "split" &&
    root.direction === "horizontal"
  ) {
    return [
      ...extractColumns(root.first),
      ...extractColumns(root.second),
    ];
  }

  return [root];
}

function appendColumn(
  root: LayoutNode,
  column: LayoutNode
): LayoutNode {
  // Kolom baru membagi seluruh area yang sudah ada.
  return createSplit("horizontal", root, column);
}

function replaceColumn(
  root: LayoutNode,
  targetIndex: number,
  replacement: LayoutNode
): LayoutNode {
  if (
    root.type !== "split" ||
    root.direction !== "horizontal"
  ) {
    return replacement;
  }

  const firstColumnCount = extractColumns(root.first).length;

  if (targetIndex < firstColumnCount) {
    return {
      ...root,
      first: replaceColumn(
        root.first,
        targetIndex,
        replacement
      ),
    };
  }

  return {
    ...root,
    second: replaceColumn(
      root.second,
      targetIndex - firstColumnCount,
      replacement
    ),
  };
}

function appendRow(
  column: LayoutNode,
  windowId: string
): LayoutNode {
  return createSplit(
    "vertical",
    column,
    createLeaf(windowId)
  );
}


/**
 * Pola penambahan:
 *
 * 1  = satu area penuh
 * 2  = dua kolom
 * 3  = tambah baris kolom 1
 * 4  = tambah baris kolom 2
 * 5  = tambah kolom 3
 * 6  = tambah baris kolom 1
 * 7  = tambah baris kolom 2
 * 8  = tambah baris kolom 3
 * 9  = tambah kolom 4
 *
 * Siklus akan terus berulang.
 */
export function insertWindow(
  root: LayoutNode | null,
  windowId: string
): LayoutNode {
  if (!root) return createLeaf(windowId);

  const existingIds = getWindowIds(root);

  if (existingIds.includes(windowId)) {
    return root;
  }

  // Window kedua selalu membentuk kolom kedua.
  if (existingIds.length === 1) {
    return createSplit(
      "horizontal",
      root,
      createLeaf(windowId)
    );
  }

  const columns = extractColumns(root);
  const columnCount = columns.length;
  const windowCount = existingIds.length;

  const cyclePosition = (windowCount - 2) % (columnCount + 1);

  // Semua kolom sudah mendapat satu tambahan baris.
  // Saatnya membuat kolom baru.
  if (cyclePosition === columnCount) {
    return appendColumn(root, createLeaf(windowId));
  }

  // Tambahkan baris pada kolom sesuai urutan siklus.
  const targetColumn = cyclePosition;

  const updatedColumn = appendRow(
    columns[targetColumn],
    windowId
  );

  return replaceColumn(
    root,
    targetColumn,
    updatedColumn
  );
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

/**
 * Resize split berdasarkan path.
 * 0 = first, 1 = second.
 *
 * Parent size digunakan untuk mengubah delta pixel
 * menjadi perubahan rasio.
 */
export function resizeSplit(
  node: LayoutNode,
  path: string,
  delta: number,
  parentSize: number
): LayoutNode {
  if (node.type === "window") return node;

  if (path.length === 0) {
    return {
      ...node,
      ratio: clampRatio(
        node.ratio + delta / Math.max(1, parentSize)
      ),
    };
  }

  const [direction, ...remaining] = path;
  const nextPath = remaining.join("");

  if (direction === "0") {
    return {
      ...node,
      first: resizeSplit(
        node.first,
        nextPath,
        delta,
        parentSize
      ),
    };
  }

  return {
    ...node,
    second: resizeSplit(
      node.second,
      nextPath,
      delta,
      parentSize
    ),
  };
}

/**
 * Menghasilkan ukuran window sekaligus divider.
 */
export function calculateDwindleLayout(
  root: LayoutNode | null,
  rect: WindowRect,
  gap: number
): LayoutCalculation {
  const windows: LayoutResult[] = [];
  const dividers: DividerResult[] = [];

  if (!root) {
    return { windows, dividers };
  }

  function calculate(
    node: LayoutNode,
    area: WindowRect,
    path: string
  ) {
    if (node.type === "window") {
      windows.push({
        windowId: node.windowId,
        rect: area,
      });

      return;
    }

    const horizontal = node.direction === "horizontal";
    const parentSize = horizontal ? area.width : area.height;

    const available = Math.max(0, parentSize - gap);
    const firstSize = available * node.ratio;
    const secondSize = available - firstSize;

    const dividerRect: WindowRect = horizontal
      ? {
          x: area.x + firstSize,
          y: area.y,
          width: gap,
          height: area.height,
        }
      : {
          x: area.x,
          y: area.y + firstSize,
          width: area.width,
          height: gap,
        };

    dividers.push({
      id: path,
      direction: node.direction,
      rect: dividerRect,
      parentSize,
    });

    if (horizontal) {
      calculate(
        node.first,
        {
          x: area.x,
          y: area.y,
          width: firstSize,
          height: area.height,
        },
        `${path}0`
      );

      calculate(
        node.second,
        {
          x: area.x + firstSize + gap,
          y: area.y,
          width: secondSize,
          height: area.height,
        },
        `${path}1`
      );
    } else {
      calculate(
        node.first,
        {
          x: area.x,
          y: area.y,
          width: area.width,
          height: firstSize,
        },
        `${path}0`
      );

      calculate(
        node.second,
        {
          x: area.x,
          y: area.y + firstSize + gap,
          width: area.width,
          height: secondSize,
        },
        `${path}1`
      );
    }
  }

  calculate(root, rect, "");

  return {
    windows,
    dividers,
  };
}
