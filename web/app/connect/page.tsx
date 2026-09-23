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
    <main className="min-h-screen bg-apple-canvas">
      {/* Global Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-apple-black border-b border-apple-hairline z-50">
        <div className="max-w-6xl mx-auto px-lg flex items-center justify-between h-11">
          <Link
            href="/"
            className="text-nav-link font-sf-text font-normal text-apple-body-on-dark hover:text-apple-body-muted transition-colors"
          >
            Kru
          </Link>
          <ConnectionStatus status={status} />
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-11">
        {/* Hero Section */}
        <section className="bg-apple-parchment px-lg py-section border-b border-apple-hairline">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-xl items-start">
              {/* Left: QR Code */}
              <div className="flex-1 flex flex-col items-center">
                <h1 className="text-display-lg font-sf-display font-semibold text-apple-ink mb-md text-center">
                  Scan to connect
                </h1>
                <p
                  className="text-body font-sf-text font-normal text-apple-ink-muted-80 text-center mb-xl"
                  style={{ maxWidth: "448px" }}
                >
                  Open the Kru Android app and scan this QR code from your phone.
                </p>
                <div className="bg-apple-canvas rounded-lg p-lg shadow-sm border border-apple-hairline">
                  <QrDisplay payload={qrPayload} />
                </div>
              </div>

              {/* Right: Connection Status & Info */}
              <div className="flex-1 flex flex-col gap-lg">
                {/* Status Card */}
                <div className="bg-apple-canvas rounded-lg p-lg border border-apple-hairline shadow-sm">
                  <h2 className="text-tagline font-sf-display font-semibold text-apple-ink mb-md">
                    Connection Status
                  </h2>
                  <SessionStatusText status={status} />
                </div>

                {/* Device Card */}
                {connection.device && (
                  <div className="bg-apple-canvas rounded-lg p-lg border border-apple-hairline shadow-sm">
                    <h2 className="text-tagline font-sf-display font-semibold text-apple-ink mb-md">
                      Your Device
                    </h2>
                    <DeviceCard device={connection.device} />
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-apple-pearl rounded-lg p-lg">
                  <h3 className="text-body-strong font-sf-text font-semibold text-apple-ink mb-sm">
                    Requirements
                  </h3>
                  <ul className="text-body font-sf-text font-normal text-apple-ink-muted-80 space-y-sm">
                    <li className="flex gap-sm">
                      <span className="text-apple-primary">✓</span>
                      <span>Same Wi-Fi network or phone hotspot</span>
                    </li>
                    <li className="flex gap-sm">
                      <span className="text-apple-primary">✓</span>
                      <span>Android app installed on phone</span>
                    </li>
                    <li className="flex gap-sm">
                      <span className="text-apple-primary">✓</span>
                      <span>Firewall must allow LAN connections</span>
                    </li>
                  </ul>
                  <p className="text-caption font-sf-text font-normal text-apple-ink-muted-48 mt-md">
                    College and enterprise Wi-Fi is often blocked due to firewall restrictions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error Messages */}
        {error && (
          <section className="bg-red-50 border-b border-red-200 px-lg py-md">
            <div className="max-w-4xl mx-auto">
              <p className="text-body font-sf-text font-normal text-red-900">{error}</p>
            </div>
          </section>
        )}

        {lan.failure && (
          <section className="bg-red-50 border-b border-red-200 px-lg py-md">
            <div className="max-w-4xl mx-auto">
              <p className="text-body font-sf-text font-normal text-red-900">{lan.failure}</p>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-apple-parchment px-lg py-section border-t border-apple-hairline">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-display-md font-sf-display font-semibold text-apple-ink mb-md">
              Ready to browse your phone?
            </h2>
            <p className="text-lead font-sf-text font-normal text-apple-ink-muted-80 mb-xl">
              Your files are waiting. No uploads, no delays, just local access.
            </p>
            {status === "connected" && (
              <Link
                href="/files"
                className="inline-flex items-center justify-center rounded-pill bg-apple-primary text-white font-sf-text font-normal px-5xl py-md hover:bg-apple-primary-focus transition-all active:scale-95"
              >
                Go to Files &rarr;
              </Link>
            )}
            <p className="text-caption font-sf-text font-normal text-apple-ink-muted-48 mt-lg">
              Once connected, you can browse your phone's file system from this browser.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
