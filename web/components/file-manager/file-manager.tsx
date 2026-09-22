"use client";

import { Breadcrumb } from "./breadcrumb";
import { FileList } from "./file-list";
import { Sidebar } from "./sidebar";
import { peerSession } from "@/lib/connection/peer-session";
import type { FileEntry } from "@/types/filesystem";
import type { TransferView } from "@/lib/connection/peer-session";

export function FileManager({
  entries,
  path,
  transfers,
  previewUrl,
}: {
  entries: FileEntry[];
  path: string;
  transfers: TransferView[];
  previewUrl: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button type="button" className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white" onClick={() => {
          const name = window.prompt("Folder name");
          if (name) peerSession.createFolder(name).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Could not create the folder."));
        }}>
          New folder
        </button>
        <label className="rounded-full border border-stone-400 px-4 py-2 text-sm">
          Upload
          <input
            className="hidden"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) peerSession.upload(path, file).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Upload failed."));
            }}
          />
        </label>
        <button type="button" className="text-sm" onClick={() => peerSession.openDirectory(path)}>Refresh</button>
      </div>
      <div className="grid min-h-[24rem] grid-cols-[12rem_1fr] overflow-hidden rounded-2xl border border-stone-300 bg-[#fbfaf7]">
        <Sidebar current={path} onOpen={(next) => peerSession.openDirectory(next)} />
        <div>
          <Breadcrumb path={path} />
          <FileList
            entries={entries}
            onOpen={(entry) => peerSession.openDirectory(entry.path)}
            onDownload={(entry) => peerSession.download(entry).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Download failed."))}
            onRename={(entry) => {
              const name = window.prompt("New name", entry.name);
              if (name) peerSession.rename(entry, name).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Rename failed."));
            }}
            onDelete={(entry) => {
              if (window.confirm(`Delete ${entry.name}?`)) {
                peerSession.remove(entry).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Delete failed."));
              }
            }}
          />
        </div>
      </div>
      {previewUrl ? <img src={previewUrl} alt="" className="max-h-80 rounded-xl" /> : null}
      <section className="rounded-2xl border border-stone-300 bg-white p-4">
        <h2 className="font-medium">Transfers</h2>
        {transfers.length === 0 ? <p className="mt-2 text-sm text-stone-600">No transfers yet.</p> : null}
        <ul className="mt-2 flex flex-col gap-2">
          {transfers.map((transfer) => {
            const percent = transfer.total ? Math.round((transfer.transferred / transfer.total) * 100) : 0;
            return (
              <li key={transfer.id} className="text-sm">
                <p>{transfer.name}</p>
                <p>
                  {transfer.direction === "download" ? "Downloading" : "Uploading"} {percent}% {transfer.status}
                  {transfer.error ? ` ${transfer.error}` : ""}
                </p>
                {transfer.status === "transferring" ? (
                  <button type="button" onClick={() => peerSession.cancel(transfer.id)}>Cancel</button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
