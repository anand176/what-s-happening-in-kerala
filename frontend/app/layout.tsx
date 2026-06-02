import type { Metadata } from "next";
import {
  DM_Sans,
  Noto_Sans_Malayalam,
  Noto_Serif_Malayalam,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { QueryProviders } from "@/components/QueryProviders";

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
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: "/logo.png",
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
      className={`${dmSans.variable} ${playfair.variable} ${notoMlSerif.variable} ${notoMlSans.variable} h-full antialiased`}
      style={{ backgroundColor: "#0b0f14", color: "#d8dee9", colorScheme: "dark" }}
    >
      <body
        className="min-h-full flex flex-col font-sans"
        style={{ backgroundColor: "#0b0f14", color: "#d8dee9" }}
      >
        <QueryProviders>{children}</QueryProviders>
      </body>
    </html>
  );
}
