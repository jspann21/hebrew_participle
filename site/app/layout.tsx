import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sblHebrew = localFont({
  src: "../public/fonts/SBL_Hbrw.ttf",
  weight: "400",
  display: "swap",
  variable: "--font-sbl-hebrew",
});

export const metadata: Metadata = {
  title: "BHSA Participle Explorer",
  description: "Visualize participle patterns across the BHSA corpus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sblHebrew.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
