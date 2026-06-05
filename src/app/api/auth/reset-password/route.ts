import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** 이메일로 유저 존재 확인 (비밀번호 찾기 1단계) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();
  if (!email) return Response.json({ found: false });
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { name: true },
  });
  return Response.json(user ? { found: true, name: user.name } : { found: false });
}

/** 비밀번호 재설정 (인증코드 검증은 클라이언트 플로우에서 send-reset-code로 처리) */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const { email, newPassword } = body as { email?: string; newPassword?: string };
  if (!newPassword || newPassword.length < 6)
    return Response.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { email: { equals: email?.trim() ?? "", mode: "insensitive" } },
  });
  if (!user) return Response.json({ error: "존재하지 않는 계정입니다." }, { status: 404 });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return Response.json({ ok: true });
}
