"use client";

import { ConnectionStatus } from "@/components/connection/connection-status";
import { FileManager } from "@/components/file-manager/file-manager";
import { useFiles } from "@/hooks/use-files";

export default function FilesPage() {
  const files = useFiles();
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Android phone</h1>
        <ConnectionStatus status="idle" />
      </header>
      <FileManager entries={files.entries} />
    </main>
  );
}
