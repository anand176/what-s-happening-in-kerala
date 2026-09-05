import type { Metadata, Viewport } from "next";
import {
  DM_Sans,
  Noto_Sans_Malayalam,
  Noto_Serif_Malayalam,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { QueryProviders } from "@/components/QueryProviders";
import { ServiceWorkerRegister } from "@/components/chrome/ServiceWorkerRegister";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const notoMlSerif = Noto_Serif_Malayalam({
  variable: "--font-noto-ml-serif",
  subsets: ["latin", "malayalam"],
  weight: ["400", "700"],
});

const notoMlSans = Noto_Sans_Malayalam({
  variable: "--font-noto-ml-sans",
  subsets: ["latin", "malayalam"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Kerala Monitor",
  description:
    "Live streams, Kerala map, fuel & gold, news, festivals and movies — God's Own Country dashboard.",
  applicationName: "Kerala Monitor",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Kerala Monitor",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e13",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} ${notoMlSerif.variable} ${notoMlSans.variable} h-full antialiased`}
      style={{ backgroundColor: "#0a0e13", color: "#e3e8f0", colorScheme: "dark" }}
    >
      <body
        className="min-h-full flex flex-col font-sans"
        style={{ backgroundColor: "#0a0e13", color: "#e3e8f0" }}
      >
        <QueryProviders>{children}</QueryProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
