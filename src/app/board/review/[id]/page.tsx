import type { Metadata } from "next";
import { reviewPosts } from "@/lib/mockData";
import ReviewDetail from "./ReviewDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = reviewPosts.find((p) => p.id === Number(id));
  if (!post) return { title: "후기" };
  return {
    title: post.title,
    description: post.content.slice(0, 150),
    openGraph: { title: post.title, type: "article" },
  };
}

export default function Page() {
  return <ReviewDetail />;
}
