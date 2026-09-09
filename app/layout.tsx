import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INDIS Conference Tracker",
  description: "QR scanning system for INDIS conference itinerary tracking",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
