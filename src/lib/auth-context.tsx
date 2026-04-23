"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MemberType, MemberGrade } from "@/lib/mockData";
import { gradeFromPoints, GRADE_THRESHOLDS, getPointRewards } from "@/lib/points";

/* ── 타입 ── */
export interface User {
  email: string;
  name: string;
  memberType: MemberType;
  businessName?: string;
  points: number;
  grade: MemberGrade;
}

interface StoredUser extends User {
  password: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  login:       (email: string, password: string) => { ok: boolean; error?: string };
  register:    (data: RegisterData) => { ok: boolean; error?: string };
  logout:      () => void;
  awardPoints: (pts: number) => void;
  /** 비밀번호 재설정 — 이메일로 유저 찾아 비밀번호 변경 */
  resetPassword: (email: string, newPassword: string) => { ok: boolean; error?: string };
  /** 이메일로 유저 존재 여부 + 이름 확인 */
  findUserByEmail: (email: string) => { found: boolean; name?: string };
  /** 관리자 전용 — 특정 유저 포인트/등급 직접 변경 */
  adminSetPoints: (email: string, points: number) => void;
  adminSetGrade:  (email: string, grade: MemberGrade) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  memberType: "general" | "business";
  businessName?: string;
}

/* ── 시드 계정 ── */
const SEED_ACCOUNTS: StoredUser[] = [
  { email: "asdf1a",            password: "asdf1a", name: "관리자", memberType: "admin",    points: 9999, grade: "VIP",  createdAt: "2024-01-01" },
  { email: "business@test.com", password: "1234", name: "업소회원", memberType: "business", businessName: "테스트업소", points: 500, grade: "우수", createdAt: "2024-01-01" },
  { email: "user@test.com",     password: "1234", name: "일반회원", memberType: "general",  points: 100, grade: "일반", createdAt: "2024-01-01" },
];

const USERS_KEY   = "vn_users";
const SESSION_KEY = "vn_session";

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const users = JSON.parse(raw) as StoredUser[];
      // 기존 유저에 points/grade 없으면 마이그레이션
      return users.map((u) => ({
        ...u,
        points: u.points ?? 0,
        grade:  u.grade  ?? gradeFromPoints(u.points ?? 0),
      }));
    }
  } catch {}
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_ACCOUNTS));
  return SEED_ACCOUNTS;
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function userToSession(u: StoredUser): User {
  return {
    email:        u.email,
    name:         u.name,
    memberType:   u.memberType,
    businessName: u.businessName,
    points:       u.points ?? 0,
    grade:        u.grade  ?? gradeFromPoints(u.points ?? 0),
  };
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  /* 새로고침 시 세션 복원 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as User;
      // 최신 포인트/등급 반영 (다른 탭에서 변경됐을 수도)
      const users = loadUsers();
      const fresh = users.find((u) => u.email === session.email);
      if (fresh) {
        const updated = userToSession(fresh);
        setUser(updated);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      } else {
        setUser(session);
      }
    } catch {}
  }, []);

  /* ── 로그인 ── */
  const login = (email: string, password: string): { ok: boolean; error?: string } => {
    if (!email.trim() || !password) return { ok: false, error: "이메일과 비밀번호를 입력해주세요." };
    const users = loadUsers();
    const idx = users.findIndex(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );
    if (idx === -1) return { ok: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." };

    // 1일 1회 로그인 포인트 지급
    const today = new Date().toISOString().slice(0, 10);
    const loginDateKey = `vn_last_login_${users[idx].email}`;
    const lastLoginDate = localStorage.getItem(loginDateKey);
    let loginBonus = 0;
    if (lastLoginDate !== today) {
      const rewards = getPointRewards();
      loginBonus = rewards.login;
      localStorage.setItem(loginDateKey, today);
      const newPoints = (users[idx].points ?? 0) + loginBonus;
      const newGrade  = gradeFromPoints(newPoints);
      users[idx] = { ...users[idx], points: newPoints, grade: newGrade };
      saveUsers(users);
    }

    const session = userToSession(users[idx]);
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, ...(loginBonus > 0 ? { loginBonus } : {}) } as { ok: boolean; error?: string };
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
    if (users.some((u) => u.name.toLowerCase() === name.trim().toLowerCase()))
      return { ok: false, error: "이미 사용 중인 닉네임입니다." };
    const newUser: StoredUser = {
      email: email.trim(), password, name: name.trim(),
      memberType, businessName: businessName?.trim(),
      points: 0, grade: "새싹",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    saveUsers([...users, newUser]);
    const session = userToSession(newUser);
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true };
  };

  /* ── 로그아웃 ── */
  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  /* ── 포인트 지급 (현재 로그인 유저) ── */
  const awardPoints = (pts: number) => {
    if (!user) return;
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email === user.email);
    if (idx === -1) return;
    const newPoints = (users[idx].points ?? 0) + pts;
    const newGrade  = gradeFromPoints(newPoints);
    users[idx] = { ...users[idx], points: newPoints, grade: newGrade };
    saveUsers(users);
    const updated: User = { ...user, points: newPoints, grade: newGrade };
    setUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  };

  /* ── 이메일로 유저 존재 여부 확인 ── */
  const findUserByEmail = (email: string): { found: boolean; name?: string } => {
    const users = loadUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    return found ? { found: true, name: found.name } : { found: false };
  };

  /* ── 비밀번호 재설정 ── */
  const resetPassword = (email: string, newPassword: string): { ok: boolean; error?: string } => {
    if (newPassword.length < 6) return { ok: false, error: "비밀번호는 6자 이상이어야 합니다." };
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (idx === -1) return { ok: false, error: "존재하지 않는 계정입니다." };
    users[idx] = { ...users[idx], password: newPassword };
    saveUsers(users);
    return { ok: true };
  };

  /* ── 관리자: 포인트 직접 설정 ── */
  const adminSetPoints = (email: string, points: number) => {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) return;
    const newGrade = gradeFromPoints(points);
    users[idx] = { ...users[idx], points, grade: newGrade };
    saveUsers(users);
    // 해당 유저가 현재 로그인 중이면 세션도 갱신
    if (user?.email === email) {
      const updated: User = { ...user, points, grade: newGrade };
      setUser(updated);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    }
  };

  /* ── 관리자: 등급 직접 설정 (포인트는 해당 등급 최솟값으로) ── */
  const adminSetGrade = (email: string, grade: MemberGrade) => {
    const threshold = GRADE_THRESHOLDS.find((t) => t.grade === grade);
    const minPoints = threshold?.min ?? 0;
    adminSetPoints(email, minPoints);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, awardPoints, resetPassword, findUserByEmail, adminSetPoints, adminSetGrade }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
