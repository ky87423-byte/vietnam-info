"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { freePosts, gradeColors } from "@/lib/mockData";
import { getUserPosts, getMockOverrides, getPinnedPosts, getLikeState, StoredPost } from "@/lib/store";
import { Post } from "@/lib/mockData";

const PAGE_SIZE = 15;

export default function FreeBoard() {
  const [userPosts, setUserPosts] = useState<StoredPost[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const mockHidden = getMockOverrides();
    setUserPosts(getUserPosts("free").filter((p) => !p.hidden));
    void mockHidden;
  }, []);

  const mockHidden = getMockOverrides();
  const visibleMock = freePosts.filter((p) => !mockHidden[p.id]?.hidden);
  const pinnedIds = new Set(getPinnedPosts().free);
  const allPosts: Post[] = [...(userPosts as unknown as Post[]), ...visibleMock];
  const pinnedPosts = allPosts.filter(p => pinnedIds.has(p.id));
  const normalPosts = allPosts.filter(p => !pinnedIds.has(p.id));
  const totalPages = Math.max(1, Math.ceil(normalPosts.length / PAGE_SIZE));
  const paginated  = normalPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const renderRow = (post: Post, index: number | "pin", isPinned = false) => {
    const { count: likeCount } = getLikeState(post.id, post.likes);
    const rowNum = typeof index === "number"
      ? allPosts.length - ((page - 1) * PAGE_SIZE + index)
      : null;

    return (
      <tr
        key={`${isPinned ? "pin-" : ""}${post.id}`}
        className={`border-b border-gray-100 last:border-0 transition-colors ${
          isPinned ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"
        }`}
      >
        {/* 번호 */}
        <td className="pl-3 pr-1 py-2.5 text-center w-8 sm:w-12 sm:pl-4">
          {isPinned
            ? <span className="text-base leading-none">📌</span>
            : <span className="text-xs text-gray-400">{rowNum}</span>
          }
        </td>

        {/* 제목 + 모바일 메타 */}
        <td className="px-1 py-2.5 sm:px-3">
          <Link href={`/board/free/${post.id}`} className="block group">
            {/* 제목 행 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <span className={`text-sm font-medium line-clamp-1 group-hover:text-red-700 transition-colors ${
                  isPinned ? "text-red-700" : "text-gray-800"
                }`}>
                  {post.title}
                </span>
                {post.commentCount > 0 && (
                  <span className="text-xs text-red-500 flex-shrink-0 font-medium">
                    [{post.commentCount}]
                  </span>
                )}
              </div>
              {/* 모바일 전용 추천수 */}
              {likeCount > 0 && (
                <span className="sm:hidden text-xs font-bold text-blue-600 flex-shrink-0 bg-blue-50 px-1.5 py-0.5 rounded">
                  {likeCount}
                </span>
              )}
            </div>

            {/* 모바일 전용 메타 라인 */}
            <div className="flex items-center gap-1 mt-0.5 sm:hidden flex-wrap">
              <span className="text-xs text-gray-600 font-medium">{post.author}</span>
              {post.authorGrade && (
                <span className={`text-xs px-1 py-px rounded-full leading-none ${gradeColors[post.authorGrade]}`}>
                  {post.authorGrade}
                </span>
              )}
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">조회 {post.views.toLocaleString()}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{post.createdAt}</span>
            </div>
          </Link>
        </td>

        {/* 작성자 (sm 이상) */}
        <td className="hidden sm:table-cell px-3 py-2.5 w-24">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 truncate max-w-[60px]">{post.author}</span>
            {post.authorGrade && (
              <span className={`text-xs px-1 py-px rounded-full leading-none hidden md:inline ${gradeColors[post.authorGrade]}`}>
                {post.authorGrade}
              </span>
            )}
          </div>
        </td>

        {/* 추천 (sm 이상) */}
        <td className="hidden sm:table-cell px-2 py-2.5 text-center w-12">
          {likeCount > 0 && (
            <span className="text-xs font-bold text-blue-600">{likeCount}</span>
          )}
        </td>

        {/* 조회 (sm 이상) */}
        <td className="hidden sm:table-cell px-3 py-2.5 text-xs text-gray-400 w-16 text-right">
          {post.views.toLocaleString()}
        </td>

        {/* 날짜 (md 이상) */}
        <td className="hidden md:table-cell px-3 py-2.5 text-xs text-gray-400 w-20 pr-4">
          {post.createdAt}
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💬 자유게시판</h1>
          <p className="text-sm text-gray-500 mt-1">일반회원 이상 작성 가능</p>
        </div>
        <Link href="/board/free/write"
          className="bg-red-700 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-red-800 transition-colors font-medium">
          글쓰기
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="pl-3 pr-1 py-2.5 text-xs font-semibold text-gray-400 w-8 sm:w-12 sm:pl-4">번호</th>
              <th className="px-1 py-2.5 text-left text-xs font-semibold text-gray-500 sm:px-3">제목</th>
              <th className="hidden sm:table-cell px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-24">작성자</th>
              <th className="hidden sm:table-cell px-2 py-2.5 text-center text-xs font-semibold text-gray-500 w-12">추천</th>
              <th className="hidden sm:table-cell px-3 py-2.5 text-right text-xs font-semibold text-gray-500 w-16">조회</th>
              <th className="hidden md:table-cell px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-20 pr-4">날짜</th>
            </tr>
          </thead>
          <tbody>
            {pinnedPosts.map((post) => renderRow(post, "pin", true))}
            {paginated.map((post, i) => renderRow(post, i))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                p === page ? "bg-red-700 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-red-300"
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
