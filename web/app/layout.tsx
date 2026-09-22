import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kru",
  description: "Browse an Android phone from the desktop browser on the same Wi-Fi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
