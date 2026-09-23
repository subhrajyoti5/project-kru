import { formatBytes } from "@/lib/utils/format";
import type { FileEntry } from "@/types/filesystem";

export function FileItem({ entry }: { entry: FileEntry }) {
  const isDir = entry.type === "directory";
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-2">
      <span>{isDir ? "Folder" : "File"} {entry.name}</span>
      <span className="text-sm text-stone-500">{isDir ? "" : formatBytes(entry.size)}</span>
    </div>
  );
}
