import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";
import { serializeComment } from "@/lib/serialize";

/** 전체 댓글 목록 (관리자 전용) */
export async function GET() {
  const user = await getSessionUser();
  if (!isAdmin(user)) return Response.json({ error: "권한이 없습니다." }, { status: 403 });

  const comments = await prisma.comment.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  return Response.json({ comments: comments.map(serializeComment) });
}
