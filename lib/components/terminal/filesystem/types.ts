export type FileSystemNodeType =
  | "directory"
  | "file"
  | "application";

export interface FileSystemNode {
  id: string;
  name: string;
  type: FileSystemNodeType;

  path: string;
  parentPath: string;

  description?: string;
  icon?: string;

  children?: FileSystemNode[];

  // Used to identify which GUI workspace to open.
  workspaceId?: string;
}
