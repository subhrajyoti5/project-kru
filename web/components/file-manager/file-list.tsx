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
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2">
          <button type="button" className="text-left" onClick={() => (entry.isDirectory ? onOpen(entry) : onDownload(entry))}>
            <span>{entry.isDirectory ? "Folder" : "File"} </span>
            {entry.name}
          </button>
          <span className="text-sm text-stone-500">{entry.isDirectory ? "" : formatBytes(entry.size)}</span>
          <span className="flex gap-2 text-sm">
            {!entry.isDirectory ? (
              <button type="button" onClick={() => onDownload(entry)}>Download</button>
            ) : null}
            <button type="button" onClick={() => onRename(entry)}>Rename</button>
            <button type="button" onClick={() => onDelete(entry)}>Delete</button>
          </span>
        </div>
      ))}
    </div>
  );
}
