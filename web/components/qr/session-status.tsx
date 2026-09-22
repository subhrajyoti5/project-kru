import type { SessionStatus } from "@/types/session";

export function SessionStatusText({ status }: { status: SessionStatus | "idle" }) {
  return <p className="text-sm text-stone-500">Session {status}</p>;
}
