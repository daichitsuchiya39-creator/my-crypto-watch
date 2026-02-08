import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "推しコイン実力チェッカー",
  description: "あなたの推しコインは本当に強い？主要銘柄と比べて実力を丸裸にします。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-[#0f172a] text-slate-50">
        {children}
      </body>
    </html>
  );
}
