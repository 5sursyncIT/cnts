import type { Metadata, Viewport } from "next";
import { Public_Sans, Newsreader, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ConsentBanner } from "@/components/consent-banner";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portail Patient — SGI-CNTS",
  description: "Site institutionnel et espace patient",
  manifest: "/app/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CNTS Patient",
  },
};

export const viewport: Viewport = {
  themeColor: "#7a1118",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${publicSans.variable} ${newsreader.variable} ${splineMono.variable} antialiased`}
      >
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-black"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="contenu">{children}</main>
        <SiteFooter />
        <ConsentBanner />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
