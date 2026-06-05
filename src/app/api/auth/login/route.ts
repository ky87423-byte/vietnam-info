import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";
import { awardPoints, getPointConfig } from "@/lib/points-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const { email, password } = body as { email?: string; password?: string };
  if (!email?.trim() || !password)
    return Response.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
  });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
    return Response.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  if (user.status === "blocked")
    return Response.json({ error: "차단된 계정입니다." }, { status: 403 });

  // 1일 1회 로그인 포인트
  const today = new Date().toISOString().slice(0, 10);
  let loginBonus = 0;
  let updated = user;
  if (user.lastLoginDate !== today) {
    const config = await getPointConfig();
    loginBonus = config.login;
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginDate: today } });
    if (loginBonus > 0) {
      const balance = await awardPoints(user.id, "login", loginBonus, "1일 1회 로그인");
      updated = { ...user, points: balance, lastLoginDate: today };
    }
  }

  await setSession(user.id);
  return Response.json({ user: serializeUser(updated), loginBonus });
}
