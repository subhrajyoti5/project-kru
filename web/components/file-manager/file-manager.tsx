import { Breadcrumb } from "./breadcrumb";
import { FileList } from "./file-list";
import { Sidebar } from "./sidebar";
import type { FileEntry } from "@/types/filesystem";

export function FileManager({ entries }: { entries: FileEntry[] }) {
  return (
    <div className="grid min-h-[24rem] grid-cols-[12rem_1fr] overflow-hidden rounded-2xl border border-stone-300 bg-[#fbfaf7]">
      <Sidebar />
      <div>
        <Breadcrumb path="Home" />
        <FileList entries={entries} />
      </div>
    </div>
  );
}
