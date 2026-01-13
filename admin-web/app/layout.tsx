import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import Providers from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
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
      <body className={`${spaceGrotesk.className} ${spaceGrotesk.variable}`}> 
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
