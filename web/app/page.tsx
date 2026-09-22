import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <p className="text-sm uppercase tracking-wide text-stone-500">Same Wi-Fi</p>
      <h1 className="text-4xl font-semibold">Your phone, in the browser.</h1>
      <p className="text-lg text-stone-700">
        This computer shows a QR code. The Android app scans it. Files stay on the local network.
      </p>
      <Link
        href="/connect"
        className="w-fit rounded-full bg-stone-900 px-5 py-3 text-stone-50"
      >
        Show QR code
      </Link>
    </main>
  );
}
