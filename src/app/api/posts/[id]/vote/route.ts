import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

/**
 * 추천/비추천 토글 (1인 1표)
 * body: { value: 1 | -1 }
 * - 같은 값 다시 누르면 취소
 * - 반대 값 누르면 교체 (추천 ↔ 비추천)
 */
export async function POST(request: NextRequest, ctx: RouteContext<'/api/posts/[id]/vote'>) {
  const { id: idStr } = await ctx.params;
  const postId = Number(idStr);
  if (!Number.isInteger(postId)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const value = body?.value;
  if (value !== 1 && value !== -1)
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  const existing = await prisma.postVote.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (!existing) {
    // 신규 투표
    await prisma.$transaction([
      prisma.postVote.create({ data: { postId, userId: user.id, value } }),
      prisma.post.update({
        where: { id: postId },
        data: value === 1 ? { likeCount: { increment: 1 } } : { dislikeCount: { increment: 1 } },
      }),
    ]);
  } else if (existing.value === value) {
    // 같은 값 → 취소
    await prisma.$transaction([
      prisma.postVote.delete({ where: { id: existing.id } }),
      prisma.post.update({
        where: { id: postId },
        data: value === 1 ? { likeCount: { decrement: 1 } } : { dislikeCount: { decrement: 1 } },
      }),
    ]);
  } else {
    // 반대 값 → 교체
    await prisma.$transaction([
      prisma.postVote.update({ where: { id: existing.id }, data: { value } }),
      prisma.post.update({
        where: { id: postId },
        data: value === 1
          ? { likeCount: { increment: 1 }, dislikeCount: { decrement: 1 } }
          : { likeCount: { decrement: 1 }, dislikeCount: { increment: 1 } },
      }),
    ]);
  }

  const updated = await prisma.post.findUnique({
    where: { id: postId },
    select: { likeCount: true, dislikeCount: true },
  });
  const myVote = await prisma.postVote.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { value: true },
  });

  return Response.json({
    likes:    Math.max(0, updated?.likeCount ?? 0),
    dislikes: Math.max(0, updated?.dislikeCount ?? 0),
    myVote:   myVote?.value ?? 0,
  });
}

/** 내 투표 상태 조회 */
export async function GET(_request: NextRequest, ctx: RouteContext<'/api/posts/[id]/vote'>) {
  const { id: idStr } = await ctx.params;
  const postId = Number(idStr);
  if (!Number.isInteger(postId)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ myVote: 0 });

  const vote = await prisma.postVote.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { value: true },
  });
  return Response.json({ myVote: vote?.value ?? 0 });
}
