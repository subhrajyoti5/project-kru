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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-stone-800"
            onClick={() => {
              const name = window.prompt("Folder name");
              if (name)
                peerSession
                  .createFolder(name)
                  .catch((error: unknown) =>
                    window.alert(error instanceof Error ? error.message : "Could not create the folder.")
                  );
            }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New folder</span>
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 shadow-xs transition hover:bg-stone-50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload</span>
            <input
              className="hidden"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file)
                  peerSession
                    .upload(path, file)
                    .catch((error: unknown) =>
                      window.alert(error instanceof Error ? error.message : "Upload failed.")
                    );
              }}
            />
          </label>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-xs transition hover:bg-stone-50"
          onClick={() => peerSession.openDirectory(path || "/")}
          title="Refresh current directory"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
      <div className="grid min-h-[24rem] grid-cols-[12rem_1fr] overflow-hidden rounded-2xl border border-stone-300 bg-[#fbfaf7]">
        <Sidebar current={path} onOpen={(next) => peerSession.openDirectory(next)} />
        <div className="flex flex-col">
          <Breadcrumb path={path} onNavigate={(next) => peerSession.openDirectory(next)} />
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
