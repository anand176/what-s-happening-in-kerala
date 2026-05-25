import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Malayalam, Noto_Serif_Malayalam } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  title: "Kerala Monitor — God's Own Country Dashboard",
  description:
    "Real-time command center for Kerala: live news, weather, markets, air quality, seismic activity, fuel prices, festivals and more.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoMlSerif.variable} ${notoMlSans.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
