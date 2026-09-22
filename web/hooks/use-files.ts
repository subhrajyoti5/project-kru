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
    entries: snapshot.entries,
    path: snapshot.path,
    transfers: snapshot.transfers,
    previewUrl: snapshot.previewUrl,
    ready: snapshot.status === "connected",
  };
}
