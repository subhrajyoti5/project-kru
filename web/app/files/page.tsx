"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { DeviceCard } from "@/components/connection/device-card";
import { FileManager } from "@/components/file-manager/file-manager";
import { useFiles } from "@/hooks/use-files";
import { usePhone } from "@/hooks/use-phone";
import { peerSession } from "@/lib/connection/peer-session";

export default function FilesPage() {
  const router = useRouter();
  const files = useFiles();
  const device = usePhone();

  const handleDisconnect = () => {
    peerSession.stop();
    router.push("/connect");
  };

  const handleRefresh = () => {
    peerSession.openDirectory(files.path || "/");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/connect"
            className="group flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-xs transition hover:bg-stone-50 hover:text-stone-900"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Connect</span>
          </Link>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-semibold tracking-wide text-stone-800">Kru Files</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh directory"
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-xs transition hover:bg-stone-50 hover:text-stone-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            title="Disconnect session"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Disconnect
          </button>
        </div>
      </nav>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{device?.name ?? "Android phone"}</h1>
          <p className="text-sm text-stone-600">
            {[device?.manufacturer, device?.model].filter(Boolean).join(" ")}
          </p>
        </div>
        <ConnectionStatus status={device?.connectionStatus ?? "idle"} />
      </header>

      <DeviceCard device={device} />

      {files.ready ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 text-sm text-emerald-800">
          <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Connected. Files move securely over the LAN data channel, directly between devices.</span>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 border border-amber-200">
          <span>Not connected to phone session yet.</span>
          <Link href="/connect" className="font-medium underline hover:text-amber-950">
            Connect from QR page &rarr;
          </Link>
        </div>
      )}

      <FileManager
        entries={files.entries}
        path={files.path}
        transfers={files.transfers}
        previewUrl={files.previewUrl}
      />
    </main>
  );
}
