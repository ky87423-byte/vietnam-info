"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { freePosts, gradeColors } from "@/lib/mockData";
import { getUserPosts, getMockOverrides, getPinnedPosts, StoredPost } from "@/lib/store";
import { Post } from "@/lib/mockData";

const PAGE_SIZE = 15;

export default function FreeBoard() {
  const [userPosts, setUserPosts] = useState<StoredPost[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const mockHidden = getMockOverrides();
    setUserPosts(getUserPosts("free").filter((p) => !p.hidden));
    // mock 숨김 필터는 렌더 시 적용
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
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell w-12">번호</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">제목</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell w-24">작성자</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell w-16">조회</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell w-20">날짜</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pinnedPosts.map((post) => (
              <tr key={`pin-${post.id}`} className="bg-red-50 hover:bg-red-100 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">📌</td>
                <td className="px-4 py-3">
                  <Link href={`/board/free/${post.id}`}
                    className="text-sm font-medium text-red-700 hover:text-red-900 transition-colors">
                    {post.title}
                    {post.commentCount > 0 && (
                      <span className="ml-1.5 text-xs text-red-500">[{post.commentCount}]</span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-600">{post.author}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{post.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{post.createdAt}</td>
              </tr>
            ))}
            {paginated.map((post, i) => (
              <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">
                  {allPosts.length - ((page - 1) * PAGE_SIZE + i)}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/board/free/${post.id}`}
                    className="text-sm font-medium text-gray-800 hover:text-red-700 transition-colors">
                    {post.title}
                    {post.commentCount > 0 && (
                      <span className="ml-1.5 text-xs text-red-500">[{post.commentCount}]</span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-600">{post.author}</span>
                    {post.authorGrade && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${gradeColors[post.authorGrade]}`}>
                        {post.authorGrade}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{post.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{post.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
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
