import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "검색",
  description: "베트남인포 통합 검색 - 게시글, 업소 정보를 한 번에 검색하세요",
  openGraph: {
    title: "검색 | 베트남인포",
    description: "베트남인포 통합 검색 - 게시글, 업소 정보를 한 번에 검색하세요",
    type: "website",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
