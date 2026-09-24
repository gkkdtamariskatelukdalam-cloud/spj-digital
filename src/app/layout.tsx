import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPJ Digital - SMA Negeri 1 Telukdalam",
  description:
    "Sistem Surat Pertanggungjawaban (SPJ) Pengadaan ATK BOSP 2025 - SMA Negeri 1 Telukdalam",
  keywords: [
    "SPJ",
    "Surat Pertanggungjawaban",
    "ATK",
    "BOSP",
    "SMA Negeri 1 Telukdalam",
    "Pengadaan",
  ],
  authors: [{ name: "SMA Negeri 1 Telukdalam" }],
  icons: {
    // ?v=2 forces browsers to re-fetch favicon (busts cache from before
    // the BOSP logo was uploaded). The endpoint always returns the latest
    // uploaded logo from the database.
    icon: "/api/favicon?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
