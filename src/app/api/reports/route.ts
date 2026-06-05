import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";

/** 신고 목록 (관리자 전용) */
export async function GET() {
  const user = await getSessionUser();
  if (!isAdmin(user)) return Response.json({ error: "권한이 없습니다." }, { status: 403 });

  const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return Response.json({
    reports: reports.map((r) => ({
      id:           r.id,
      targetType:   r.targetType,
      targetId:     r.targetId,
      postId:       r.postId ?? undefined,
      reporterName: r.reporterName,
      reason:       r.reason,
      detail:       r.detail || undefined,
      status:       r.status,
      createdAt:    r.createdAt.toISOString().slice(0, 10),
    })),
  });
}

/** 신고 접수 (로그인 필수) */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const { targetType, targetId, postId, reason, detail } = body as {
    targetType?: string; targetId?: number; postId?: number;
    reason?: string; detail?: string;
  };

  if (targetType !== "post" && targetType !== "comment")
    return Response.json({ error: "신고 대상이 올바르지 않습니다." }, { status: 400 });
  if (!Number.isInteger(targetId))
    return Response.json({ error: "신고 대상이 올바르지 않습니다." }, { status: 400 });
  if (!["spam", "abuse", "illegal", "adult", "other"].includes(reason ?? ""))
    return Response.json({ error: "신고 사유를 선택해주세요." }, { status: 400 });

  const report = await prisma.report.create({
    data: {
      targetType,
      targetId: targetId!,
      postId: Number.isInteger(postId) ? postId : null,
      reporterId: user.id,
      reporterName: user.name,
      reason: reason!,
      detail: detail?.trim() ?? "",
    },
  });

  return Response.json({ ok: true, id: report.id });
}
