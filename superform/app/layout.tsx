import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Superform — Build forms that feel like products",
  description: "A premium form builder with aesthetic quality, intelligent UX, and response intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
