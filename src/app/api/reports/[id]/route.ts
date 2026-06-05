import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";

/** 신고 상태 변경 (관리자 전용) — body: { status: "pending"|"resolved"|"dismissed" } */
export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/reports/[id]'>) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return Response.json({ error: "잘못된 ID" }, { status: 400 });

  const user = await getSessionUser();
  if (!isAdmin(user)) return Response.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!["pending", "resolved", "dismissed"].includes(status))
    return Response.json({ error: "잘못된 상태값입니다." }, { status: 400 });

  await prisma.report.update({ where: { id }, data: { status } });
  return Response.json({ ok: true });
}
