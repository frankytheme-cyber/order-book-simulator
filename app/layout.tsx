import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Order Book Simulator",
  description: "Real-time order book simulator with Price/Time priority matching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistMono.variable}>
      <body className="antialiased bg-[#0a0a0a] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
