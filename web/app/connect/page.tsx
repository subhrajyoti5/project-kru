"use client";

import { ConnectionStatus } from "@/components/connection/connection-status";
import { DeviceCard } from "@/components/connection/device-card";
import { QrDisplay } from "@/components/qr/qr-display";
import { SessionStatusText } from "@/components/qr/session-status";
import { useConnection } from "@/hooks/use-connection";
import { useLanChannel } from "@/hooks/use-lan-channel";
import { useSession } from "@/hooks/use-session";
import type { SessionStatus } from "@/types/session";

export default function ConnectPage() {
  const { session, qrPayload, error } = useSession();
  const connection = useConnection(session);
  const lan = useLanChannel(qrPayload);
  const status: SessionStatus | "idle" =
    lan.phase === "connected" || connection.status === "connected" ? "connected" : connection.status;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Connect your phone</h1>
          <p className="mt-2 max-w-md text-stone-700">
            Open the Android app and scan this code. The website creates the code. The phone does not.
          </p>
        </div>
        <ConnectionStatus status={status} />
      </header>
      {error ? <p className="text-red-800">{error}</p> : null}
      {lan.failure ? <p className="max-w-md text-red-800">{lan.failure}</p> : null}
      <div className="flex flex-wrap items-start gap-8">
        <QrDisplay payload={qrPayload} />
        <div className="flex flex-col gap-3">
          <SessionStatusText status={status} />
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
