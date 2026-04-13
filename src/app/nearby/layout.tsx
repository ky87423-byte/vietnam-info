import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "주변업소찾기",
  description:
    "호치민 주변 업소를 지도로 찾아보세요 - 음식점, 골프장, 숙소, 렌트카, 환전소 위치 및 거리 안내",
  keywords: ["호치민 지도", "주변 음식점", "호치민 맛집 지도", "호치민 업소 위치"],
  openGraph: {
    title: "주변업소찾기 | 베트남인포",
    description: "호치민 주변 업소를 지도로 찾아보세요 - 음식점, 골프, 숙소, 렌트카, 환전",
    type: "website",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
