import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import "./globals.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: {
    default: "ボッチャリーグひめじ | BOCCIA LEAGUE HIMEJI",
    template: "%s | ボッチャリーグひめじ",
  },
  description:
    "兵庫県姫路市を中心としたボッチャリーグの公式サイト。順位表、試合日程・結果、大会レポートをお届けします。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${notoSans.variable} font-sans min-h-screen flex flex-col`}>
        <AppShell>{children}</AppShell>
        <Footer />
      </body>
    </html>
  );
}
