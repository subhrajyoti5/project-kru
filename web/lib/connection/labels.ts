import type { SessionStatus } from "@/types/session";

export function connectionLabel(status: SessionStatus | "idle" | "link"): string {
  switch (status) {
    case "idle":
    case "pending":
      return "Waiting for the phone";
    case "paired":
      return "Connecting...";
    case "link":
      return "Link established";
    case "connected":
      return "Connected";
    case "disconnected":
      return "Disconnected - waiting to reconnect";
    case "expired":
      return "QR expired";
    case "closed":
      return "Disconnected";
  }
}
