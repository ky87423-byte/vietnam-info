import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const { email, password, name, memberType, businessName } = body as {
    email?: string; password?: string; name?: string;
    memberType?: string; businessName?: string;
  };

  if (!email?.trim())  return Response.json({ error: "이메일을 입력해주세요." }, { status: 400 });
  if (!name?.trim())   return Response.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  if (!password || password.length < 6)
    return Response.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
  if (memberType !== "general" && memberType !== "business")
    return Response.json({ error: "회원 유형이 올바르지 않습니다." }, { status: 400 });
  if (memberType === "business" && !businessName?.trim())
    return Response.json({ error: "업소명을 입력해주세요." }, { status: 400 });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return Response.json({ error: "올바른 이메일 형식이 아닙니다." }, { status: 400 });

  const emailNorm = email.trim().toLowerCase();
  const nameNorm  = name.trim();

  const dupEmail = await prisma.user.findFirst({ where: { email: { equals: emailNorm, mode: "insensitive" } } });
  if (dupEmail) return Response.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  const dupName = await prisma.user.findFirst({ where: { name: { equals: nameNorm, mode: "insensitive" } } });
  if (dupName) return Response.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      name: nameNorm,
      passwordHash,
      memberType,
      businessName: memberType === "business" ? businessName!.trim() : undefined,
    },
  });

  await setSession(user.id);
  return Response.json({ user: serializeUser(user) });
}
