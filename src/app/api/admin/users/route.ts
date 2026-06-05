import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

/** 회원 목록 (관리자 전용) */
export async function GET() {
  const user = await getSessionUser();
  if (!isAdmin(user)) return Response.json({ error: "권한이 없습니다." }, { status: 403 });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
  return Response.json({ users: users.map(serializeUser) });
}
