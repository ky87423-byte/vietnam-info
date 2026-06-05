import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { serializeComment } from "@/lib/serialize";
import { awardPoints, getPointConfig } from "@/lib/points-server";

/** 댓글 목록 (최신순) */
export async function GET(_request: NextRequest, ctx: RouteContext<'/api/posts/[id]/comments'>) {
  const { id: idStr } = await ctx.params;
  const postId = Number(idStr);
  if (!Number.isInteger(postId)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { postId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ comments: comments.map(serializeComment) });
}

/** 댓글 작성 (로그인 필수) */
export async function POST(request: NextRequest, ctx: RouteContext<'/api/posts/[id]/comments'>) {
  const { id: idStr } = await ctx.params;
  const postId = Number(idStr);
  if (!Number.isInteger(postId)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const content = (body?.content as string | undefined)?.trim();
  if (!content) return Response.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });

  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { postId, authorId: user.id, authorName: user.name, content },
    }),
    prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
  ]);

  const config = await getPointConfig();
  const balance = await awardPoints(user.id, "comment", config.comment, `댓글 (게시글 #${postId})`);

  return Response.json({ comment: serializeComment(comment), awarded: config.comment, balance });
}
