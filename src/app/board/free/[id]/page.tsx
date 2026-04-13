import type { Metadata } from "next";
import { freePosts } from "@/lib/mockData";
import FreePostDetail from "./FreePostDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = freePosts.find((p) => p.id === Number(id));
  if (!post) return { title: "게시글" };
  return {
    title: post.title,
    description: post.content.slice(0, 150),
    openGraph: { title: post.title, type: "article" },
  };
}

export default function Page() {
  return <FreePostDetail />;
}
