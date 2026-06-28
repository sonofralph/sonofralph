import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mise — Everything in its place.",
  description:
    "Everything in its place. Mise gives hospitality teams real-time inventory visibility across every location, supplier, and item — so you never run out, never over-order, and never lose margin to waste.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mise",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" style={{ colorScheme: "light" }}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} h-full bg-slate-50 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
