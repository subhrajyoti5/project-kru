import { FileItem } from "./file-item";
import type { FileEntry } from "@/types/filesystem";

export function FileList({ entries }: { entries: FileEntry[] }) {
  if (entries.length === 0) {
    return <p className="px-3 py-6 text-stone-600">No files yet. The phone has not opened a LAN channel.</p>;
  }
  return (
    <div className="divide-y divide-stone-200">
      {entries.map((entry) => (
        <FileItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
