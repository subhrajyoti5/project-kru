"use client";

import { QRCodeSVG } from "qrcode.react";
import { encodeQrPayload } from "@/lib/qr/payload";
import type { QrPayload } from "@/types/session";

export function QrDisplay({ payload }: { payload: QrPayload | null }) {
  if (!payload) {
    return <p className="text-stone-600">Creating a temporary QR code...</p>;
  }
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <QRCodeSVG value={encodeQrPayload(payload)} size={240} />
    </div>
  );
}
