import { fileSystem, HOME_PATH } from "./data";
import type { FileSystemNode } from "./types";

// Normalize absolute and relative paths.
export function resolvePath(
  input: string,
  currentDirectory: string = HOME_PATH
): string {
  const value = input.trim();

  if (!value || value === "~") {
    return HOME_PATH;
  }

  let target: string;

  if (value.startsWith("/")) {
    target = value;
  } else if (value.startsWith("~/")) {
    target = `${HOME_PATH}/${value.slice(2)}`;
  } else {
    target = `${currentDirectory}/${value}`;
  }

  const segments: string[] = [];

  for (const segment of target.split("/")) {
    if (!segment || segment === ".") continue;

    if (segment === "..") {
      segments.pop();
      continue;
    }

    segments.push(segment);
  }

  return `/${segments.join("/")}`;
}

// Find a node recursively by its absolute path.
export function getNodeByPath(
  path: string,
  currentDirectory: string = HOME_PATH
): FileSystemNode | null {
  const resolvedPath = resolvePath(path, currentDirectory);

  const findNode = (
    node: FileSystemNode
  ): FileSystemNode | null => {
    if (node.path === resolvedPath) {
      return node;
    }

    for (const child of node.children ?? []) {
      const result = findNode(child);

      if (result) return result;
    }

    return null;
  };

  return findNode(fileSystem);
}

// Get the children of a directory.
export function getDirectoryContents(
  path: string,
  currentDirectory: string = HOME_PATH
): FileSystemNode[] {
  const node = getNodeByPath(path, currentDirectory);

  if (!node || node.type !== "directory") {
    return [];
  }

  return node.children ?? [];
}

// Get the parent directory path.
export function getParentPath(path: string): string {
  const resolvedPath = resolvePath(path);

  if (resolvedPath === "/") {
    return "/";
  }

  const segments = resolvedPath.split("/").filter(Boolean);

  segments.pop();

  return segments.length > 0
    ? `/${segments.join("/")}`
    : "/";
}

// Check whether a path exists.
export function pathExists(
  path: string,
  currentDirectory: string = HOME_PATH
): boolean {
  return getNodeByPath(path, currentDirectory) !== null;
}
