import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";
import { serializePost } from "@/lib/serialize";

async function findPost(id: number) {
  return prisma.post.findFirst({
    where: { id, deletedAt: null },
    include: { author: { select: { points: true } } },
  });
}

/** 게시글 상세 — ?view=1 이면 조회수 증가 */
export async function GET(request: NextRequest, ctx: RouteContext<'/api/posts/[id]'>) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const post = await findPost(id);
  if (!post) return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  if (post.hidden) {
    const user = await getSessionUser();
    if (!isAdmin(user) && user?.id !== post.authorId)
      return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (request.nextUrl.searchParams.get("view") === "1") {
    await prisma.post.update({ where: { id }, data: { views: { increment: 1 } } });
    post.views += 1;
  }

  return Response.json({ post: serializePost(post) });
}

/** 게시글 수정 — 작성자 또는 관리자. 관리자는 hidden/isPinned/type 변경 가능 */
export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/posts/[id]'>) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const post = await prisma.post.findFirst({ where: { id, deletedAt: null } });
  if (!post) return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  const admin = isAdmin(user);
  const owner = post.authorId === user.id;
  if (!admin && !owner)
    return Response.json({ error: "수정 권한이 없습니다." }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const data: Record<string, unknown> = {};

  // 작성자/관리자 공통: 내용 수정
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.category === "string" || body.category === null) data.category = body.category || null;
  if (typeof body.district === "string" || body.district === null) data.district = body.district || null;
  if (typeof body.rating === "number" || body.rating === null) data.rating = body.rating;
  if (Array.isArray(body.imageUrls)) data.imageUrls = body.imageUrls.slice(0, 10);
  if (body.contacts && typeof body.contacts === "object") {
    data.contactPhone    = body.contacts.phone    ?? "";
    data.contactKakao    = body.contacts.kakao    ?? "";
    data.contactTelegram = body.contacts.telegram ?? "";
    data.contactZalo     = body.contacts.zalo     ?? "";
  }

  // 관리자 전용: 숨김/고정/게시판 이동/유료 표시
  if (admin) {
    if (typeof body.hidden === "boolean")   data.hidden = body.hidden;
    if (typeof body.isPinned === "boolean") data.isPinned = body.isPinned;
    if (typeof body.isPaid === "boolean")   data.isPaid = body.isPaid;
    if (["promotion", "free", "review"].includes(body.type)) data.type = body.type;
  }

  const updated = await prisma.post.update({
    where: { id },
    data,
    include: { author: { select: { points: true } } },
  });

  return Response.json({ post: serializePost(updated) });
}

/** 게시글 삭제 (soft delete) — 작성자 또는 관리자 */
export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/posts/[id]'>) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const post = await prisma.post.findFirst({ where: { id, deletedAt: null } });
  if (!post) return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  if (!isAdmin(user) && post.authorId !== user.id)
    return Response.json({ error: "삭제 권한이 없습니다." }, { status: 403 });

  await prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });
  return Response.json({ ok: true });
}
