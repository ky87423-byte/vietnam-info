import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";
import { awardPoints } from "@/lib/points-server";

/** 회원 정보 변경 (관리자 전용) — body: { points?: number, status?: "active"|"blocked" } */
export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/admin/users/[id]'>) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const admin = await getSessionUser();
  if (!isAdmin(admin)) return Response.json({ error: "권한이 없습니다." }, { status: 403 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return Response.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  // 포인트 직접 설정 (차액을 PointLog에 admin 액션으로 기록)
  if (typeof body.points === "number" && Number.isInteger(body.points) && body.points >= 0) {
    const diff = body.points - target.points;
    if (diff !== 0) await awardPoints(id, "admin", diff, "관리자 포인트 조정");
  }

  if (body.status === "active" || body.status === "blocked") {
    await prisma.user.update({ where: { id }, data: { status: body.status } });
  }

  const updated = await prisma.user.findUnique({ where: { id } });
  return Response.json({ user: serializeUser(updated!) });
}

/** 회원 삭제 (관리자 전용) — 게시글/댓글은 authorName 스냅샷으로 유지됨 */
export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/admin/users/[id]'>) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const admin = await getSessionUser();
  if (!isAdmin(admin)) return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  if (admin!.id === id) return Response.json({ error: "본인 계정은 삭제할 수 없습니다." }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return Response.json({ ok: true });
}
