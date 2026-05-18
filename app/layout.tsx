import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAPERGOBLIN | OCR Reconstruction Engine",
  description: "PAPERGOBLIN turns chaotic receipts, labels, and scanned documents into structured operational intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
