import { connectionLabel } from "@/lib/connection/labels";
import type { SessionStatus } from "@/types/session";

export function ConnectionStatus({ status }: { status: SessionStatus | "idle" | "link" }) {
  const connected = status === "connected";
  const disconnected = status === "disconnected";
  return (
    <p className="flex items-center gap-2 text-lg">
      <span
        className={
          connected ? "text-emerald-700" : disconnected ? "text-amber-600" : "text-stone-400"
        }
        aria-hidden
      >
        ●
      </span>
      {connectionLabel(status)}
    </p>
  );
}
