"use client";

import type { FileEntry } from "@/types/filesystem";

/** File listing waits for the LAN channel. This hook stays empty on purpose. */
export function useFiles(): { entries: FileEntry[]; ready: boolean } {
  return { entries: [], ready: false };
}
