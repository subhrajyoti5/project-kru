"use client";

import { useSyncExternalStore } from "react";
import { peerSession } from "@/lib/connection/peer-session";

export function useFiles() {
  const snapshot = useSyncExternalStore(
    (listener) => peerSession.subscribe(listener),
    () => peerSession.snapshot,
    () => peerSession.snapshot,
  );
  return {
    entries: (snapshot as any).entries ?? [],
    path: (snapshot as any).path ?? "/",
    transfers: (snapshot as any).transfers ?? [],
    previewUrl: (snapshot as any).previewUrl ?? "",
    ready: snapshot.status === "connected",
  };
}
