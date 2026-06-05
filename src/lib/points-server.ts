/**
 * 포인트 지급/차감 (서버 전용) — User.points 갱신 + PointLog 기록
 */
import { prisma } from "@/lib/prisma";
import { DEFAULT_POINT_REWARDS } from "@/lib/points";

export type PointAction = "signup" | "login" | "post" | "comment" | "admin" | "etc";

/** SiteConfig에서 포인트 지급 설정 조회 (없으면 기본값) */
export async function getPointConfig() {
  const config = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  return {
    post:    config?.pointPost    ?? DEFAULT_POINT_REWARDS.post,
    comment: config?.pointComment ?? DEFAULT_POINT_REWARDS.comment,
    login:   config?.pointLogin   ?? DEFAULT_POINT_REWARDS.login,
  };
}

/** 포인트 지급(+)/차감(-) — 갱신된 잔액 반환 */
export async function awardPoints(
  userId: number,
  action: PointAction,
  amount: number,
  memo = ""
): Promise<number> {
  if (amount === 0) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
    return u?.points ?? 0;
  }
  const [user] = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data:  { points: { increment: amount } },
    });
    await tx.pointLog.create({
      data: { userId, action, amount, balance: updated.points, memo },
    });
    return [updated];
  });
  return user.points;
}
