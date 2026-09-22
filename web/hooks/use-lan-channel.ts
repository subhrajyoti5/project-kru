"use client";

import { useEffect, useState } from "react";
import { startBrowserChannel } from "@/lib/connection/browser-channel";
import type { QrPayload } from "@/types/session";

export type LanPhase = "idle" | "connecting" | "connected" | "failed";

export function useLanChannel(payload: QrPayload | null) {
  const [phase, setPhase] = useState<LanPhase>("idle");
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!payload) return;
    let active = true;
    const handle = startBrowserChannel(payload, {
      onOpen: () => {
        if (active) setPhase("connected");
      },
      onFail: (message) => {
        if (!active) return;
        setPhase("failed");
        setFailure(message);
      },
    });
    return () => {
      active = false;
      handle.close();
    };
  }, [payload]);

  return { phase, failure };
}
