import { connectionLabel } from "@/lib/connection/labels";
import type { SessionStatus } from "@/types/session";

export function ConnectionStatus({ status }: { status: SessionStatus | "idle" }) {
  const connected = status === "connected";
  return (
    <p className="flex items-center gap-2 text-lg">
      <span
        className={connected ? "text-emerald-700" : "text-stone-400"}
        aria-hidden
      >
        ●
      </span>
      {connectionLabel(status)}
    </p>
  );
}
