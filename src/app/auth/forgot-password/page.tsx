"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Step = "email" | "code" | "reset" | "done";

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10분

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { findUserByEmail, resetPassword } = useAuth();

  const [step, setStep]           = useState<Step>("email");
  const [email, setEmail]         = useState("");
  const [userName, setUserName]   = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [timer, setTimer]         = useState(0);

  // sessionStorage에 { code, expires } 저장
  const codeRef = useRef<{ code: string; expires: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimer(600); // 10분
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Step 1: 이메일 입력 → 인증코드 발송 ── */
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) return setError("이메일을 입력해주세요.");

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return setError("올바른 이메일 형식이 아닙니다.");

    // 유저 존재 여부 확인
    const { found, name } = findUserByEmail(trimmed);
    if (!found) return setError("가입되지 않은 이메일입니다.");

    setLoading(true);
    const code = generateCode();

    try {
      const res = await fetch("/api/auth/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, code, name }),
      });
      const data = await res.json() as { ok: boolean; error?: string; dev?: boolean };

      if (!data.ok) {
        setError(data.error ?? "이메일 발송에 실패했습니다.");
        setLoading(false);
        return;
      }

      // 인증 코드를 메모리(ref)에 저장 (sessionStorage는 서버에서 접근 불가라 클라이언트 ref 사용)
      codeRef.current = { code, expires: Date.now() + CODE_EXPIRY_MS };
      setUserName(name ?? "");

      if (data.dev) {
        // 개발 모드: 서버 콘솔 확인 안내
        setError("");
        alert(`[개발 모드] 이메일 서버 미설정 상태입니다.\n인증번호 ${code} 를 서버 콘솔에서 확인하세요.\n\n(실제 배포 시 .env.local에 SMTP 설정 필요)`);
      }

      startTimer();
      setStep("code");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /* ── 재발송 ── */
  const handleResend = async () => {
    if (loading) return;
    setError("");
    setLoading(true);
    const code = generateCode();

    try {
      const res = await fetch("/api/auth/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code, name: userName }),
      });
      const data = await res.json() as { ok: boolean; error?: string; dev?: boolean };
      if (!data.ok) { setError(data.error ?? "재발송 실패"); return; }

      codeRef.current = { code, expires: Date.now() + CODE_EXPIRY_MS };
      if (data.dev) {
        alert(`[개발 모드] 인증번호: ${code}`);
      }
      setCodeInput("");
      startTimer();
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: 인증번호 확인 ── */
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!codeRef.current) return setError("인증번호를 먼저 요청하세요.");
    if (Date.now() > codeRef.current.expires) return setError("인증번호가 만료되었습니다. 재발송해주세요.");
    if (codeInput.trim() !== codeRef.current.code) return setError("인증번호가 올바르지 않습니다.");

    if (timerRef.current) clearInterval(timerRef.current);
    setStep("reset");
  };

  /* ── Step 3: 새 비밀번호 설정 ── */
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPw.length < 6) return setError("비밀번호는 6자 이상이어야 합니다.");
    if (newPw !== confirmPw) return setError("비밀번호가 일치하지 않습니다.");

    const result = resetPassword(email.trim(), newPw);
    if (!result.ok) return setError(result.error ?? "비밀번호 변경 실패");

    setStep("done");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block bg-red-700 text-white font-bold text-2xl px-4 py-2 rounded-xl mb-4">
            베트남인포
          </Link>
          <h1 className="text-xl font-bold text-gray-900">비밀번호 찾기</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === "email" && "가입한 이메일로 인증번호를 보내드립니다"}
            {step === "code"  && `${email}으로 인증번호를 발송했습니다`}
            {step === "reset" && "새 비밀번호를 설정하세요"}
            {step === "done"  && "비밀번호 변경이 완료되었습니다"}
          </p>
        </div>

        {/* 단계 표시 */}
        {step !== "done" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["email", "code", "reset"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? "bg-red-700 text-white"
                    : (["email", "code", "reset"].indexOf(step) > i)
                    ? "bg-red-200 text-red-700"
                    : "bg-gray-100 text-gray-400"
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 ${(["email","code","reset"].indexOf(step) > i) ? "bg-red-200" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

          {/* ── Step 1: 이메일 입력 ── */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">가입한 이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-800 transition-colors disabled:opacity-60"
              >
                {loading ? "발송 중..." : "인증번호 받기"}
              </button>
              <div className="text-center text-sm text-gray-500">
                <Link href="/auth/login" className="text-red-700 hover:underline">로그인으로 돌아가기</Link>
              </div>
            </form>
          )}

          {/* ── Step 2: 인증번호 입력 ── */}
          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">인증번호 6자리</label>
                  {timer > 0 && (
                    <span className={`text-sm font-mono font-bold ${timer < 60 ? "text-red-500" : "text-gray-500"}`}>
                      {formatTimer(timer)}
                    </span>
                  )}
                  {timer === 0 && (
                    <span className="text-xs text-red-500">만료됨</span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  autoFocus
                  maxLength={6}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-center tracking-widest font-mono text-lg focus:outline-none focus:border-red-400"
                />
                <p className="text-xs text-gray-400 mt-1.5">{email}으로 발송된 6자리 숫자를 입력하세요.</p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
              <button
                type="submit"
                disabled={codeInput.length < 6}
                className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-800 transition-colors disabled:opacity-60"
              >
                인증번호 확인
              </button>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <button type="button" onClick={() => { setStep("email"); setError(""); }} className="hover:text-gray-700">
                  이메일 다시 입력
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-red-700 hover:underline disabled:opacity-60"
                >
                  {loading ? "발송 중..." : "재발송"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: 새 비밀번호 ── */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">새 비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="6자 이상 입력"
                    autoFocus
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-red-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showPw ? "숨김" : "표시"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호 확인</label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="비밀번호를 다시 입력"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                    confirmPw && confirmPw !== newPw
                      ? "border-red-300 focus:border-red-400"
                      : confirmPw && confirmPw === newPw
                      ? "border-green-300 focus:border-green-400"
                      : "border-gray-200 focus:border-red-400"
                  }`}
                />
                {confirmPw && confirmPw === newPw && (
                  <p className="text-xs text-green-600 mt-1">비밀번호가 일치합니다.</p>
                )}
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
              <button
                type="submit"
                className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-800 transition-colors"
              >
                비밀번호 변경 완료
              </button>
            </form>
          )}

          {/* ── 완료 ── */}
          {step === "done" && (
            <div className="text-center py-4 space-y-4">
              <div className="text-5xl">✅</div>
              <div>
                <p className="font-bold text-gray-900 text-lg">비밀번호가 변경되었습니다</p>
                <p className="text-sm text-gray-500 mt-1">새 비밀번호로 로그인해주세요.</p>
              </div>
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-800 transition-colors"
              >
                로그인하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
