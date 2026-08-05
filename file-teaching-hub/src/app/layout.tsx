import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "高校化學事",
  description: "科普知識·銜接教材·Podcast",
  openGraph: {
    title: "高校化學事",
    description: "科普知識·銜接教材·Podcast",
    url: "https://www.jimmylipodcast.tw",
    siteName: "高校化學事",
    images: [
      {
        url: "https://www.jimmylipodcast.tw/og-image.png",
        width: 1200,
        height: 630,
        alt: "高校化學事預覽圖片",
      },
    ],
    locale: "zh_TW",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
