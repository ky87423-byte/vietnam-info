import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "후기게시판",
  description:
    "호치민 한인 커뮤니티 후기게시판 - 음식점, 골프장, 숙소, 렌트카, 환전소 실제 이용 후기",
  keywords: ["호치민 맛집 후기", "호치민 골프 후기", "호치민 숙소 후기", "업소 리뷰"],
  openGraph: {
    title: "후기게시판 | 베트남인포",
    description: "호치민 한인 커뮤니티 후기게시판 - 음식점, 골프, 숙소 실제 이용 후기",
    type: "website",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
