"use client";

import { useEffect, useState } from "react";
import { peerSession } from "@/lib/connection/peer-session";
import type { QrPayload } from "@/types/session";

export type LanPhase = "idle" | "connecting" | "connected" | "failed";

export function useLanChannel(payload: QrPayload | null) {
  const [phase, setPhase] = useState<LanPhase>("idle");
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => peerSession.subscribe(() => {
    if (peerSession.status === "connected") setPhase("connected");
    else if (peerSession.status === "failed") {
      setPhase("failed");
      setFailure(peerSession.failure);
    } else if (peerSession.status === "connecting") setPhase("connecting");
    else if (peerSession.status === "disconnected") setPhase("failed");
  }), []);

  useEffect(() => {
    if (!payload) return;
    peerSession.start(payload).catch((cause: unknown) => {
      setPhase("failed");
      setFailure(cause instanceof Error ? cause.message : "Unable to connect.");
    });
  }, [payload]);

  return { phase, failure };
}
