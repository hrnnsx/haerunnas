import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetBrainMono = JetBrains_Mono({
  variable: "--font-jetbrain-mono",
  subsets: ["latin"],
  weight: "200"
});

export const metadata: Metadata = {
  title: "Haerunnas",
  description: "Crafting digital experiences where logic meets art.",
  icons: {
    icon: [{
      url: "/mdi--google-downasaur.svg",
      type: "image/svg+xml",
      sizes: "any",
    }]
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jetBrainMono.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col ">{children}</body>
    </html>
  );
}
