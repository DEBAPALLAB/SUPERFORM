import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  weight: ["400"],
  variable: "--font-bebas",
  subsets: ["latin"],
});

import LenisProvider from "@/components/LenisProvider";
import TransitionProvider from "@/components/TransitionProvider";

export const metadata: Metadata = {
  title: "Superform",
  description: "Build forms so beautiful, people ask what you used.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} ${dmMono.variable} ${bebas.variable} antialiased h-full`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FAF8F4] text-[#0D0D0D] selection:bg-[#0D0D0D] selection:text-[#FAF8F4]">
        <LenisProvider>
          <TransitionProvider>
            {children}
          </TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
