import type { SessionStatus } from "@/types/session";

export function connectionLabel(status: SessionStatus | "idle"): string {
  switch (status) {
    case "idle":
    case "pending":
      return "Waiting for the phone";
    case "paired":
      return "Connecting...";
    case "connected":
      return "Connected";
    case "expired":
    case "closed":
      return "Unable to connect";
  }
}
