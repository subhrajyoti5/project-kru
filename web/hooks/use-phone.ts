"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/api/client";
import { readStoredSession } from "@/lib/session-store";
import type { Device } from "@/types/device";

export function usePhone() {
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    const stored = readStoredSession();
    if (!stored) return;
    let stopped = false;
    const tick = () => {
      getSession(stored.sessionId, stored.token)
        .then((session) => {
          if (!stopped) setDevice(session.device);
        })
        .catch(() => {
          if (!stopped) setDevice(null);
        });
    };
    tick();
    const timer = setInterval(tick, 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  return device;
}
