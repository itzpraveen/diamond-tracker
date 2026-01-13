import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import Providers from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Diamond Buyback Admin",
  description: "Admin console for Diamond Buyback Tracking"
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
