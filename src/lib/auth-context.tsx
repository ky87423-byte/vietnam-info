"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MemberType } from "@/lib/mockData";

/* ── 타입 ── */
export interface User {
  email: string;
  name: string;
  memberType: MemberType;
  businessName?: string;
}

interface StoredUser extends User {
  password: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (data: RegisterData) => { ok: boolean; error?: string };
  logout: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  memberType: "general" | "business";
  businessName?: string;
}

/* ── 초기 시드 계정 (테스트용) ── */
const SEED_ACCOUNTS: StoredUser[] = [
  { email: "admin@test.com",    password: "1234", name: "관리자",   memberType: "admin",    createdAt: "2024-01-01" },
  { email: "business@test.com", password: "1234", name: "업소회원", memberType: "business", businessName: "테스트업소", createdAt: "2024-01-01" },
  { email: "user@test.com",     password: "1234", name: "일반회원", memberType: "general",  createdAt: "2024-01-01" },
];

const USERS_KEY = "vn_users";
const SESSION_KEY = "vn_session";

/* ── 유저 목록 로드 (없으면 시드 삽입) ── */
function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch {}
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_ACCOUNTS));
  return SEED_ACCOUNTS;
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  /* 새로고침 시 세션 복원 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {}
  }, []);

  /* ── 로그인 ── */
  const login = (email: string, password: string): { ok: boolean; error?: string } => {
    if (!email.trim() || !password) return { ok: false, error: "이메일과 비밀번호를 입력해주세요." };

    const users = loadUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );

    if (!found) return { ok: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." };

    const session: User = {
      email:        found.email,
      name:         found.name,
      memberType:   found.memberType,
      businessName: found.businessName,
    };
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true };
  };

  /* ── 회원가입 ── */
  const register = (data: RegisterData): { ok: boolean; error?: string } => {
    const { email, password, name, memberType, businessName } = data;

    if (!email.trim())    return { ok: false, error: "이메일을 입력해주세요." };
    if (!name.trim())     return { ok: false, error: "닉네임을 입력해주세요." };
    if (password.length < 6) return { ok: false, error: "비밀번호는 6자 이상이어야 합니다." };
    if (memberType === "business" && !businessName?.trim())
      return { ok: false, error: "업소명을 입력해주세요." };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { ok: false, error: "올바른 이메일 형식이 아닙니다." };

    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim()))
      return { ok: false, error: "이미 사용 중인 이메일입니다." };

    const newUser: StoredUser = {
      email:        email.trim(),
      password,
      name:         name.trim(),
      memberType,
      businessName: businessName?.trim(),
      createdAt:    new Date().toISOString().slice(0, 10),
    };

    saveUsers([...users, newUser]);

    /* 가입 후 자동 로그인 */
    const session: User = {
      email:        newUser.email,
      name:         newUser.name,
      memberType:   newUser.memberType,
      businessName: newUser.businessName,
    };
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true };
  };

  /* ── 로그아웃 ── */
  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
