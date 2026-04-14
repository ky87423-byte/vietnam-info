"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = login(email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "로그인에 실패했습니다.");
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block bg-red-700 text-white font-bold text-2xl px-4 py-2 rounded-xl mb-4">
            베트남인포
          </Link>
          <h1 className="text-xl font-bold text-gray-900">로그인</h1>
          <p className="text-sm text-gray-500 mt-1">호치민 한인 커뮤니티에 오신 걸 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">아이디 / 이메일</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="아이디 또는 이메일을 입력하세요"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
          </div>

          <div className="flex items-center justify-end text-xs text-gray-500">
            <Link href="#" className="hover:text-red-700">비밀번호 찾기</Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-800 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-white px-3">소셜 로그인</span>
            </div>
          </div>

          {/* 구글 로그인 */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.2 13.1 17.6 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z"/>
              <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.6 10.7l7.8-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.4 0-11.8-4.3-13.7-10l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
            </svg>
            Google로 로그인
          </button>

          {/* 카카오 로그인 */}
          <button
            type="button"
            onClick={() => signIn("kakao", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] rounded-xl py-2.5 text-sm font-medium text-[#3C1E1E] hover:bg-[#F0D900] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#3C1E1E" d="M12 3C6.477 3 2 6.477 2 11c0 2.9 1.6 5.5 4 7.1L5 22l4.4-2.9c.8.2 1.7.3 2.6.3 5.523 0 10-3.477 10-8S17.523 3 12 3z"/>
            </svg>
            카카오로 로그인
          </button>

          <div className="text-center text-sm text-gray-600 pt-2">
            아직 회원이 아니신가요?{" "}
            <Link href="/auth/register" className="text-red-700 font-semibold hover:underline">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
