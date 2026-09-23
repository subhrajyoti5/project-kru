"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { DeviceCard } from "@/components/connection/device-card";
import { QrDisplay } from "@/components/qr/qr-display";
import { SessionStatusText } from "@/components/qr/session-status";
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

  useEffect(() => {
    if (status === "connected") {
      router.push("/files");
    }
  }, [status, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-8">
      <nav className="flex items-center justify-between border-b border-stone-200 pb-4">
        <Link
          href="/"
          className="group flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900"
        >
          <svg
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Home</span>
        </Link>
        {status === "connected" && (
          <Link
            href="/files"
            className="rounded-lg bg-stone-900 px-3.5 py-1.5 text-sm font-medium text-white shadow-xs transition hover:bg-stone-800"
          >
            Go to Files &rarr;
          </Link>
        )}
      </nav>

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
