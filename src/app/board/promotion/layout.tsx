import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "홍보게시판",
  description:
    "호치민 한인 업소 홍보게시판 - 음식점, 골프장, 숙소, 렌트카, 환전소 업체 정보를 확인하세요",
  keywords: ["호치민 음식점", "호치민 골프", "호치민 숙소", "호치민 렌트카", "호치민 환전", "업소 정보"],
  openGraph: {
    title: "홍보게시판 | 베트남인포",
    description:
      "호치민 한인 업소 홍보게시판 - 음식점, 골프장, 숙소, 렌트카, 환전소 업체 정보",
    type: "website",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
