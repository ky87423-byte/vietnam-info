import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://vietnam-info-ky87423-byte.vercel.app"
  ),
  title: {
    default: "베트남인포 - 호치민 한인 커뮤니티",
    template: "%s | 베트남인포",
  },
  description:
    "호치민 한인 커뮤니티 베트남인포 - 음식점, 골프장, 숙소, 렌트카, 환전 정보와 자유·후기·홍보 게시판",
  keywords: [
    "베트남인포", "호치민", "한인", "커뮤니티", "교민",
    "음식점", "골프", "숙소", "렌트카", "환전",
    "Vietnam", "Ho Chi Minh", "Korean community", "HCMC",
    "자유게시판", "후기게시판", "홍보게시판",
  ],
  authors: [{ name: "베트남인포" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "베트남인포",
    title: "베트남인포 - 호치민 한인 커뮤니티",
    description:
      "호치민 한인 커뮤니티 베트남인포 - 음식점, 골프장, 숙소, 렌트카, 환전 정보와 자유·후기·홍보 게시판",
  },
  twitter: {
    card: "summary",
    title: "베트남인포 - 호치민 한인 커뮤니티",
    description:
      "호치민 한인 커뮤니티 베트남인포 - 음식점, 골프장, 숙소, 렌트카, 환전 정보와 자유·후기·홍보 게시판",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
