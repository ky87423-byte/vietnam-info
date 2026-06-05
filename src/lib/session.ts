/**
 * HMAC 서명 쿠키 기반 세션 (서버 전용)
 * 토큰 형식: "<userId>.<만료 epoch ms>.<hmac>"
 */
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "vn_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30일

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET 환경변수가 설정되지 않았습니다.");
  return s;
}

function hmac(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function sign(userId: number): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

function verify(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userIdStr, expStr, sig] = parts;
  const payload = `${userIdStr}.${expStr}`;
  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expStr) < Date.now()) return null;
  const userId = Number(userIdStr);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export async function setSession(userId: number): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? verify(token) : null;
}

/** 현재 로그인 유저 (없으면 null) */
export async function getSessionUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

/** 로그인 필수 — 아니면 throw 대신 null 반환하여 호출부에서 401 처리 */
export async function requireUser() {
  return getSessionUser();
}

/** 관리자 여부 */
export function isAdmin(user: { memberType: string } | null): boolean {
  return user?.memberType === "admin";
}
