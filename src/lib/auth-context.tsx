"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { MemberType, MemberGrade } from "@/lib/mockData";
import { GRADE_THRESHOLDS } from "@/lib/points";

/* ── 타입 ── */
export interface User {
  id: number;
  email: string;
  name: string;
  memberType: MemberType;
  businessName?: string;
  points: number;
  grade: MemberGrade;
}

interface AuthContextValue {
  user: User | null;
  /** 세션 확인 완료 여부 (false 동안은 로그인 상태 미정) */
  ready: boolean;
  login:    (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string }>;
  logout:   () => void;
  /** 서버에서 최신 유저 정보(포인트 등) 재조회 — 글/댓글 작성 후 호출 */
  refreshUser: () => Promise<void>;
  /** @deprecated 포인트는 서버에서 지급됨 — refreshUser로 동작 */
  awardPoints: (pts: number) => void;
  resetPassword: (email: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  findUserByEmail: (email: string) => Promise<{ found: boolean; name?: string }>;
  /** 관리자 전용 — 특정 유저(id) 포인트 직접 변경 */
  adminSetPoints: (userId: number, points: number) => Promise<void>;
  adminSetGrade:  (userId: number, grade: MemberGrade) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  memberType: "general" | "business";
  businessName?: string;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "요청에 실패했습니다.");
  return data as T;
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const { user: u } = await api<{ user: User | null }>("/api/auth/me");
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  /* 새로고침 시 세션 복원 */
  useEffect(() => {
    refreshUser().finally(() => setReady(true));
  }, [refreshUser]);

  /* ── 로그인 ── */
  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!email.trim() || !password) return { ok: false, error: "이메일과 비밀번호를 입력해주세요." };
    try {
      const { user: u } = await api<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(u);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "로그인에 실패했습니다." };
    }
  };

  /* ── 회원가입 ── */
  const register = async (data: RegisterData): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { user: u } = await api<{ user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setUser(u);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "회원가입에 실패했습니다." };
    }
  };

  /* ── 로그아웃 ── */
  const logout = () => {
    setUser(null);
    void api("/api/auth/logout", { method: "POST" }).catch(() => {});
  };

  /* ── 하위 호환 — 포인트는 서버에서 지급되므로 최신 정보만 재조회 ── */
  const awardPoints = (_pts: number) => {
    void _pts;
    void refreshUser();
  };

  /* ── 이메일로 유저 존재 여부 확인 ── */
  const findUserByEmail = async (email: string): Promise<{ found: boolean; name?: string }> => {
    try {
      return await api<{ found: boolean; name?: string }>(
        `/api/auth/reset-password?email=${encodeURIComponent(email.trim())}`
      );
    } catch {
      return { found: false };
    }
  };

  /* ── 비밀번호 재설정 ── */
  const resetPassword = async (email: string, newPassword: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, newPassword }),
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "비밀번호 재설정에 실패했습니다." };
    }
  };

  /* ── 관리자: 포인트 직접 설정 ── */
  const adminSetPoints = async (userId: number, points: number) => {
    await api(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ points }),
    });
    if (user?.id === userId) await refreshUser();
  };

  /* ── 관리자: 등급 직접 설정 (포인트는 해당 등급 최솟값으로) ── */
  const adminSetGrade = async (userId: number, grade: MemberGrade) => {
    const threshold = GRADE_THRESHOLDS.find((t) => t.grade === grade);
    await adminSetPoints(userId, threshold?.min ?? 0);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refreshUser, awardPoints, resetPassword, findUserByEmail, adminSetPoints, adminSetGrade }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
