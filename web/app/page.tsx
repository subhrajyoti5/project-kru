import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-apple-canvas">
      {/* Hero Tile */}
      <section className="flex flex-col items-center justify-center px-6 py-section text-center">
        <div className="max-w-2xl">
          {/* Tagline */}
          <p className="text-nav-link uppercase tracking-wide text-apple-ink-muted-48 mb-lg">
            Same Wi-Fi
          </p>

          {/* Hero Headline */}
          <h1 className="text-hero-display font-sf-display font-semibold text-apple-ink mb-md">
            Your phone, in the browser.
          </h1>

          {/* Lead Description */}
          <p className="text-lead font-sf-text font-normal text-apple-ink mb-xl">
            This computer shows a QR code. The Android app scans it. Files stay on the local network.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row justify-center gap-md">
            <Link
              href="/connect"
              className="inline-flex items-center justify-center rounded-pill bg-apple-primary text-white font-sf-text font-normal px-5xl py-md hover:bg-apple-primary-focus transition-all active:scale-95"
            >
              Show QR code
            </Link>
            <Link
              href="#learn-more"
              className="inline-flex items-center justify-center rounded-pill border-2 border-apple-primary text-apple-primary font-sf-text font-normal px-5xl py-md hover:bg-apple-divider transition-all active:scale-95"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Dark Product Tile */}
      <section className="bg-apple-tile-1 px-6 py-section flex flex-col items-center justify-center text-center">
        <div className="max-w-2xl">
          <h2 className="text-display-lg font-sf-display font-semibold text-apple-body-on-dark mb-md">
            Seamless file browsing.
          </h2>
          <p className="text-lead font-sf-text font-normal text-apple-body-muted mb-xl">
            Access your phone's files directly from your desktop browser. No uploads, no cloud, no latency.
          </p>
          <p className="text-body font-sf-text font-normal text-apple-body-on-dark">
            Everything stays on your local network.
          </p>
        </div>
      </section>

      {/* Light Utility Tile */}
      <section className="bg-apple-parchment px-6 py-section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-display-lg font-sf-display font-semibold text-apple-ink text-center mb-xl">
            How it works.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-apple-primary text-white flex items-center justify-center text-body-strong font-sf-text font-semibold mb-lg">
                1
              </div>
              <h3 className="text-tagline font-sf-display font-semibold text-apple-ink mb-sm">
                Desktop shows QR
              </h3>
              <p className="text-body font-sf-text font-normal text-apple-ink-muted-80">
                Open Kru on your desktop browser.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-apple-primary text-white flex items-center justify-center text-body-strong font-sf-text font-semibold mb-lg">
                2
              </div>
              <h3 className="text-tagline font-sf-display font-semibold text-apple-ink mb-sm">
                Phone scans code
              </h3>
              <p className="text-body font-sf-text font-normal text-apple-ink-muted-80">
                Use the Kru app to scan the QR code.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-apple-primary text-white flex items-center justify-center text-body-strong font-sf-text font-semibold mb-lg">
                3
              </div>
              <h3 className="text-tagline font-sf-display font-semibold text-apple-ink mb-sm">
                Browse files
              </h3>
              <p className="text-body font-sf-text font-normal text-apple-ink-muted-80">
                Access your phone files instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Feature Tile */}
      <section className="bg-apple-tile-2 px-6 py-section flex flex-col items-center justify-center text-center">
        <div className="max-w-2xl">
          <h2 className="text-display-lg font-sf-display font-semibold text-apple-body-on-dark mb-md">
            Privacy first.
          </h2>
          <p className="text-lead font-sf-text font-normal text-apple-body-muted mb-lg">
            Your files never leave your network. No account required. No data collection. Pure local access.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-apple-parchment px-6 py-xl">
        <div className="max-w-4xl mx-auto">
          <p className="text-fine-print font-sf-text font-normal text-apple-ink-muted-80 text-center">
            © 2024 Kru. Browse your phone from the desktop.
          </p>
        </div>
      </footer>
    </main>
  );
}
