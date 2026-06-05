import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";

/** 댓글 삭제 — 작성자 또는 관리자 */
export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/comments/[id]'>) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const comment = await prisma.comment.findFirst({ where: { id, deletedAt: null } });
  if (!comment) return Response.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  if (!isAdmin(user) && comment.authorId !== user.id)
    return Response.json({ error: "삭제 권한이 없습니다." }, { status: 403 });

  await prisma.$transaction([
    prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } }),
    prisma.post.updateMany({
      where: { id: comment.postId, commentCount: { gt: 0 } },
      data:  { commentCount: { decrement: 1 } },
    }),
  ]);

  return Response.json({ ok: true });
}
