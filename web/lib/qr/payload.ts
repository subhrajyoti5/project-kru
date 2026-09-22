import type { QrPayload } from "@/types/session";

export function encodeQrPayload(payload: QrPayload): string {
  return JSON.stringify(payload);
}
