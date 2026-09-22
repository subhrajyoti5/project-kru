export type FileEntry = {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  modifiedAt: string;
  isDirectory: boolean;
  mimeType?: string;
};
