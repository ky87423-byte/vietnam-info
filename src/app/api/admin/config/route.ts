import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";
import { getPointConfig } from "@/lib/points-server";

/** 포인트 설정 조회 (관리자 전용) */
export async function GET() {
  const user = await getSessionUser();
  if (!isAdmin(user)) return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  return Response.json({ rewards: await getPointConfig() });
}

/** 포인트 설정 변경 (관리자 전용) — body: { post?, comment?, login? } */
export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!isAdmin(user)) return Response.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const data: Record<string, number> = {};
  for (const [bodyKey, dbKey] of [["post", "pointPost"], ["comment", "pointComment"], ["login", "pointLogin"]] as const) {
    const v = body[bodyKey];
    if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100000) data[dbKey] = v;
  }

  await prisma.siteConfig.upsert({
    where:  { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return Response.json({ rewards: await getPointConfig() });
}
