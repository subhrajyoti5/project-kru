import { formatBytes } from "@/lib/utils/format";
import type { FileEntry } from "@/types/filesystem";

export function FileList({
  entries,
  onOpen,
  onDownload,
  onRename,
  onDelete,
}: {
  entries: FileEntry[];
  onOpen: (entry: FileEntry) => void;
  onDownload: (entry: FileEntry) => void;
  onRename: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
}) {
  if (entries.length === 0) {
    return <p className="px-3 py-6 text-stone-600">This folder is empty.</p>;
  }
  return (
    <div className="divide-y divide-stone-200">
      {entries.map((entry) => {
        const isDir = entry.type === "directory";
        return (
          <div
            key={entry.path}
            className="group flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-white"
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              onClick={() => (isDir ? onOpen(entry) : onDownload(entry))}
            >
              <span className="text-lg leading-none">{isDir ? "📁" : "📄"}</span>
              <span className="truncate font-medium text-stone-850 group-hover:text-stone-950">
                {entry.name}
              </span>
            </button>
            <span className="shrink-0 text-xs text-stone-500">
              {isDir ? "" : formatBytes(entry.size)}
            </span>
            <div className="flex shrink-0 items-center gap-1.5 text-xs">
              {!isDir ? (
                <button
                  type="button"
                  className="rounded-md border border-stone-200 bg-white px-2 py-1 font-medium text-stone-700 hover:bg-stone-50"
                  onClick={() => onDownload(entry)}
                >
                  Download
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-md border border-stone-200 bg-white px-2 py-1 font-medium text-stone-700 hover:bg-stone-50"
                onClick={() => onRename(entry)}
              >
                Rename
              </button>
              <button
                type="button"
                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 font-medium text-red-700 hover:bg-red-100"
                onClick={() => onDelete(entry)}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
