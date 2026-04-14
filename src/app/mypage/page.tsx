"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserPosts, StoredPost } from "@/lib/store";
import { GRADE_THRESHOLDS, nextGradeInfo } from "@/lib/points";

const memberTypeLabel: Record<string, string> = {
  admin:    "관리자",
  business: "업소회원",
  general:  "일반회원",
};

const memberTypeBadge: Record<string, string> = {
  admin:    "bg-red-100 text-red-700",
  business: "bg-yellow-100 text-yellow-700",
  general:  "bg-blue-100 text-blue-700",
};

const boardLabel: Record<string, string> = {
  free:      "자유게시판",
  review:    "후기게시판",
  promotion: "홍보게시판",
};

const boardHref: Record<string, string> = {
  free:      "/board/free",
  review:    "/board/review",
  promotion: "/board/promotion",
};

export default function MyPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [myPosts, setMyPosts] = useState<StoredPost[]>([]);
  const [tab, setTab] = useState<"all" | "free" | "review" | "promotion">("all");

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    const all = getUserPosts().filter((p) => p.author === user.name);
    setMyPosts(all);
  }, [user, router]);

  if (!user) return null;

  const filtered = tab === "all" ? myPosts : myPosts.filter((p) => p.type === tab);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <span className="text-gray-700">마이페이지</span>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold text-xl">
              {user.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-gray-900">{user.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${memberTypeBadge[user.memberType] ?? "bg-gray-100 text-gray-600"}`}>
                  {memberTypeLabel[user.memberType] ?? user.memberType}
                </span>
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.businessName && (
                <p className="text-sm text-gray-600 mt-0.5">업소명: <span className="font-medium">{user.businessName}</span></p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 포인트 / 등급 */}
        {(() => {
          const gradeInfo = GRADE_THRESHOLDS.find(g => g.grade === user.grade);
          const { nextGrade, needed, progress } = nextGradeInfo(user.points);
          return (
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${gradeInfo?.color ?? "bg-gray-100 text-gray-600"}`}>
                    {user.grade}
                  </span>
                  <span className="text-sm font-bold text-gray-800">{user.points.toLocaleString()} P</span>
                </div>
                {nextGrade && (
                  <span className="text-xs text-gray-400">{nextGrade}까지 {needed.toLocaleString()}P 남음</span>
                )}
              </div>
              {nextGrade && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* 통계 */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-gray-900">{myPosts.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">작성 게시글</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {myPosts.filter((p) => p.type === "free").length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">자유게시판</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {myPosts.filter((p) => p.type === "review").length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">후기</div>
          </div>
        </div>
      </div>

      {/* 내 게시글 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">내 게시글</h2>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-100">
          {(["all", "free", "review", "promotion"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-red-700 text-red-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "all" ? "전체" : boardLabel[t]}
              <span className="ml-1 text-xs text-gray-400">
                ({t === "all" ? myPosts.length : myPosts.filter((p) => p.type === t).length})
              </span>
            </button>
          ))}
        </div>

        {/* 목록 */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            작성한 게시글이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((post) => (
              <Link
                key={post.id}
                href={`${boardHref[post.type]}/${post.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {boardLabel[post.type]}
                    </span>
                    {post.category && (
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{post.createdAt}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 text-xs text-gray-400 flex-shrink-0">
                  <span>👁 {post.views}</span>
                  <span>💬 {post.commentCount}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
