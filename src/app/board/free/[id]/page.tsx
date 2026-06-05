import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FreePostDetail from "./FreePostDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) return { title: "게시글" };
  const post = await prisma.post.findFirst({
    where: { id: numId, type: "free", hidden: false, deletedAt: null },
    select: { title: true, content: true },
  });
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
