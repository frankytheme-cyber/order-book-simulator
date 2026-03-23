import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://order-book-simulator.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Order Book Simulator | Real-Time Trading Engine",
    template: "%s | Order Book Simulator",
  },
  description:
    "Simulate a real-time financial order book with Price/Time priority matching. Visualize bids, asks, and trade execution just like professional trading platforms. Free, interactive, and browser-based.",
  keywords: [
    "order book simulator",
    "trading simulator",
    "limit order book",
    "bid ask spread",
    "price time priority",
    "market microstructure",
    "order matching engine",
    "financial trading tool",
    "stock market simulator",
    "crypto order book",
  ],
  authors: [{ name: "Simone Puliti" }],
  creator: "Simone Puliti",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Order Book Simulator | Real-Time Trading Engine",
    description:
      "Visualize how financial order books work with live bid/ask matching, trade execution, and Price/Time priority — all in your browser.",
    url: siteUrl,
    siteName: "Order Book Simulator",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Order Book Simulator | Real-Time Trading Engine",
    description:
      "Visualize how financial order books work with live bid/ask matching, trade execution, and Price/Time priority — all in your browser.",
    creator: "@simonepuliti",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Order Book Simulator",
  url: siteUrl,
  description:
    "A real-time, browser-based financial order book simulator using Price/Time priority matching. Users can visualize live bids, asks, trade history, and manually submit limit or market orders.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Real-time order book simulation",
    "Price/Time priority matching engine",
    "Bid/ask spread visualization",
    "Trade history tracking",
    "Manual limit and market order placement",
    "Adjustable simulation speed",
    "Dark and light theme",
  ],
  author: {
    "@type": "Person",
    name: "Simone Puliti",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistMono.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-slate-100 min-h-screen">
        {children}
         <Analytics />
      </body>
    </html>
  );
}
