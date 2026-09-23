"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { DeviceCard } from "@/components/connection/device-card";
import { QrDisplay } from "@/components/qr/qr-display";
import { peerSession } from "@/lib/connection/peer-session";
import { useConnection } from "@/hooks/use-connection";
import { useLanChannel } from "@/hooks/use-lan-channel";
import { useSession } from "@/hooks/use-session";
import type { SessionStatus } from "@/types/session";

export default function ConnectPage() {
  const router = useRouter();
  const { session, qrPayload, error } = useSession();
  const connection = useConnection(session);
  const lan = useLanChannel(qrPayload);
  const status: SessionStatus | "idle" =
    lan.phase === "connected" || connection.status === "connected" ? "connected" : connection.status;
  const isFailure = lan.phase === "failed" || status === "expired" || status === "closed";

  useEffect(() => {
    if (status === "connected") {
      router.push("/files");
    }
  }, [status, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Scan with KRU on Android</h1>
          <p className="mt-2 max-w-md text-stone-700">
            The website shows a QR code. The Android app scans it.
          </p>
        </div>
        <ConnectionStatus status={status} />
      </header>
      {error ? <p className="text-red-800">{error}</p> : null}
      {isFailure ? (
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-lg font-semibold text-red-800">Unable to connect</p>
          <p className="mt-1 text-sm text-red-700">
            Check that both devices are on the same Wi-Fi network.
          </p>
          <button
            type="button"
            className="mt-3 rounded-full bg-red-800 px-4 py-2 text-sm text-white"
            onClick={() => {
              if (qrPayload) {
                peerSession.start(qrPayload).catch(() => undefined);
              }
            }}
          >
            Try again
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-start gap-8">
        <QrDisplay payload={qrPayload} />
        <div className="flex flex-col gap-3">
          <DeviceCard device={connection.device} />
          <p className="max-w-sm text-sm text-stone-600">
            Use the same home Wi-Fi, or join this phone&apos;s hotspot from the laptop. College and
            enterprise Wi-Fi is refused because those firewalls block the connection.
          </p>
        </div>
      </div>
    </main>
  );
}
