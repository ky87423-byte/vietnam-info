import type { Metadata } from "next";
import { promotionPosts } from "@/lib/mockData";
import PromotionDetail from "./PromotionDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = promotionPosts.find((p) => p.id === Number(id));
  if (!post) return { title: "업소 정보" };
  return {
    title: post.title,
    description: post.content.slice(0, 150),
    openGraph: { title: post.title, type: "article" },
  };
}

export default function Page() {
  return <PromotionDetail />;
}
