import type { FileEntry } from "@/types/filesystem";

export function FileGrid({ entries }: { entries: FileEntry[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-xl bg-white px-3 py-4">
          {entry.name}
        </li>
      ))}
    </ul>
  );
}
