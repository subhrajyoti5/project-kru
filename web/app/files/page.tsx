"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { DeviceCard } from "@/components/connection/device-card";
import { FileManager } from "@/components/file-manager/file-manager";
import { useFiles } from "@/hooks/use-files";
import { usePhone } from "@/hooks/use-phone";
import { peerSession } from "@/lib/connection/peer-session";

export default function FilesPage() {
  const router = useRouter();
  const files = useFiles();
  const device = usePhone();

  const handleDisconnect = () => {
    peerSession.disconnect().then(() => {
      router.push("/connect");
    }).catch(() => {
      router.push("/connect");
    });
  };

  const handleRefresh = () => {
    peerSession.openDirectory(files.path || "/").catch(() => {});
  };

  const handleNavigateBack = () => {
    router.push("/connect");
  };

  return (
    <main className="min-h-screen bg-apple-canvas">
      {/* Global Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-apple-black border-b border-apple-hairline z-50">
        <div className="max-w-6xl mx-auto px-lg flex items-center justify-between h-11">
          <span className="text-nav-link font-sf-text font-normal text-apple-body-on-dark">
            Kru Files
          </span>
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh directory"
              className="text-nav-link font-sf-text font-normal text-apple-body-on-dark hover:text-apple-body-muted transition-colors px-sm py-xs"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <ConnectionStatus status={device?.connectionStatus ?? "idle"} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-11">
        {/* Header Section */}
        <section className="bg-apple-parchment px-lg py-section border-b border-apple-hairline">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-lg">
              <div>
                <h1 className="text-display-lg font-sf-display font-semibold text-apple-ink mb-sm">
                  {device?.name ?? "Android phone"}
                </h1>
                <p className="text-body font-sf-text font-normal text-apple-ink-muted-80">
                  {[device?.manufacturer, device?.model].filter(Boolean).join(" ")} • Files on local network
                </p>
              </div>
              <div className="flex items-center gap-md">
                <button
                  type="button"
                  onClick={handleNavigateBack}
                  className="rounded-pill border-2 border-apple-primary text-apple-primary font-sf-text font-normal px-lg py-md hover:bg-apple-divider transition-all active:scale-95"
                >
                  Back to Connect
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="rounded-pill bg-red-600 text-white font-sf-text font-normal px-lg py-md hover:bg-red-700 transition-all active:scale-95"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Connection Status Alert */}
        {files.ready ? (
          <section className="bg-green-50 border-b border-green-200 px-lg py-md">
            <div className="max-w-6xl mx-auto flex items-start gap-md">
              <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-body font-sf-text font-normal text-green-900">
                  Connected. Files move securely over the LAN data channel, directly between devices.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-amber-50 border-b border-amber-200 px-lg py-md">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <p className="text-body font-sf-text font-normal text-amber-900">
                Not connected to phone session yet.
              </p>
              <Link 
                href="/connect" 
                className="text-apple-primary font-sf-text font-normal hover:text-apple-primary-focus transition-colors"
              >
                Connect from QR page &rarr;
              </Link>
            </div>
          </section>
        )}

        {/* Device Card */}
        <section className="bg-apple-parchment px-lg py-lg border-b border-apple-hairline">
          <div className="max-w-6xl mx-auto">
            <DeviceCard device={device} />
          </div>
        </section>

        {/* File Manager */}
        <section className="px-lg py-section">
          <div className="max-w-6xl mx-auto">
            <FileManager
              entries={files.entries}
              path={files.path}
              transfers={files.transfers}
              previewUrl={files.previewUrl}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
