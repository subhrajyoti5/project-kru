"use client";

import { connectionLabel } from "@/lib/connection/labels";
import type { Device } from "@/types/device";
import type { Session, SessionStatus } from "@/types/session";

export type ConnectionView = {
  status: SessionStatus | "idle";
  label: string;
  device: Device | null;
};

export function useConnection(session: Session | null): ConnectionView {
  const status: SessionStatus | "idle" = session?.status ?? "idle";
  return {
    status,
    label: connectionLabel(status),
    device: session?.device ?? null,
  };
}
