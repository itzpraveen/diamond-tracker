import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import Providers from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Majestic Tracking Admin",
  description: "Admin console for Majestic Tracking",
  applicationName: "Majestic Tracking",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.className} ${fraunces.variable} ${manrope.variable} font-body antialiased`}> 
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
