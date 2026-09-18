import type { Metadata } from "next";
import localFont from "next/font/local";
import { Sora } from "next/font/google";
import "./globals.css";

const sansitaOne = localFont({
  src: "../../public/fonts/SansitaOne.ttf",
  variable: "--font-sansita",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shutterspace — Collaborative photo albums for every moment",
  description:
    "Shutterspace is the shared album app for trips, parties, and everyday memories. Create an album, invite friends, and collect every shot in one place.",
  metadataBase: new URL("https://shutterspace.app"),
  openGraph: {
    title: "Shutterspace",
    description:
      "Collaborative photo and video albums for the moments you share with friends and family.",
    url: "https://shutterspace.app",
    siteName: "Shutterspace",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sansitaOne.variable} ${sora.variable}`}>
      <body style={{ fontFamily: "var(--font-sora), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
