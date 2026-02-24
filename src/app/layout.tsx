import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coin Strength Checker",
  description: "Is your favorite coin truly strong? Reveal its real performance against major assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0f172a] text-slate-50">
        {children}
      </body>
    </html>
  );
}
