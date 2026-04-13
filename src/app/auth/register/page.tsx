"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") === "business" ? "business" : "general";
  const router = useRouter();
  const { register } = useAuth();

  const [memberType, setMemberType] = useState<"general" | "business">(defaultType);
  const [email, setEmail]               = useState("");
  const [nickname, setNickname]         = useState("");
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword]         = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const result = register({
      email,
      password,
      name: nickname,
      memberType,
      businessName: memberType === "business" ? businessName : undefined,
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "회원가입에 실패했습니다.");
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block bg-red-700 text-white font-bold text-2xl px-4 py-2 rounded-xl mb-4">
            베트남인포
          </Link>
          <h1 className="text-xl font-bold text-gray-900">회원가입</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-5">
          {/* 회원 유형 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">회원 유형 선택</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMemberType("general")}
                className={`p-4 rounded-xl border-2 text-center transition-colors ${
                  memberType === "general" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-2xl mb-1">👤</p>
                <p className={`text-sm font-semibold ${memberType === "general" ? "text-red-700" : "text-gray-700"}`}>일반회원</p>
                <p className="text-xs text-gray-500 mt-1">자유/후기게시판 이용</p>
              </button>
              <button
                type="button"
                onClick={() => setMemberType("business")}
                className={`p-4 rounded-xl border-2 text-center transition-colors ${
                  memberType === "business" ? "border-yellow-500 bg-yellow-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-2xl mb-1">🏢</p>
                <p className={`text-sm font-semibold ${memberType === "business" ? "text-yellow-700" : "text-gray-700"}`}>업소회원</p>
                <p className="text-xs text-gray-500 mt-1">홍보게시판 등록 가능</p>
              </button>
            </div>
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">이메일 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">닉네임 *</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="사용할 닉네임"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
          </div>

          {/* 업소명 (업소회원만) */}
          {memberType === "business" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">업소명 *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="등록할 업소명"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
          )}

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호 * <span className="text-xs font-normal text-gray-400">(6자 이상)</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호 확인 *</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none ${
                passwordConfirm && password !== passwordConfirm
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-red-400"
              }`}
            />
            {passwordConfirm && password !== passwordConfirm && (
              <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 등급 안내 */}
          {memberType === "general" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">🏆 일반회원 등급 안내</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-blue-600">
                <span>🌱 새싹 (0~49점)</span>
                <span>👤 일반 (50~199점)</span>
                <span>⭐ 우수 (200~499점)</span>
                <span>🔥 전문가 (500~999점)</span>
                <span>💎 VIP (1000점+)</span>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-800 transition-colors disabled:opacity-60"
          >
            {loading ? "처리 중..." : memberType === "business" ? "업소회원으로 가입" : "일반회원으로 가입"}
          </button>

          <div className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="text-red-700 font-semibold hover:underline">
              로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
