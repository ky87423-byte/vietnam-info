import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "자유게시판",
  description:
    "호치민 한인 커뮤니티 자유게시판 - 생활 정보, 일상 이야기를 자유롭게 나눠보세요",
  keywords: ["호치민 자유게시판", "호치민 한인 커뮤니티", "교민 게시판", "베트남 생활"],
  openGraph: {
    title: "자유게시판 | 베트남인포",
    description: "호치민 한인 커뮤니티 자유게시판 - 생활 정보, 일상 이야기",
    type: "website",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
