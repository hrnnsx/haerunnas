
export type SplitDirection = "horizontal" | "vertical";

export type LayoutMode = "dwindle" | "master";

export interface WindowLeaf {
  type: "window";
  windowId: string;
}

export interface SplitNode {
  type: "split";
  direction: SplitDirection;
  ratio: number;
  first: LayoutNode;
  second: LayoutNode;
}

export type LayoutNode = WindowLeaf | SplitNode;

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  windowId: string;
  rect: WindowRect;
}

export interface WorkspaceConfig {
  gap: number;
  outerGap: number;
  defaultSplitRatio: number;
  masterRatio: number;
  masterPosition: "left" | "right" | "top" | "bottom";
}
