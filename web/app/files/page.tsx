"use client";

import { ConnectionStatus } from "@/components/connection/connection-status";
import { DeviceCard } from "@/components/connection/device-card";
import { FileManager } from "@/components/file-manager/file-manager";
import { useFiles } from "@/hooks/use-files";
import { usePhone } from "@/hooks/use-phone";

export default function FilesPage() {
  const files = useFiles();
  const device = usePhone();
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-6 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{device?.name ?? "Android phone"}</h1>
          <p className="text-sm text-stone-600">
            {[device?.manufacturer, device?.model].filter(Boolean).join(" ")}
          </p>
        </div>
        <ConnectionStatus status={device?.connectionStatus ?? "idle"} />
      </header>
      <DeviceCard device={device} />
      <FileManager entries={files.entries} />
    </main>
  );
}
