"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { reviewPosts } from "@/lib/mockData";
import { getUserPosts, getMockOverrides, getPinnedPosts, StoredPost } from "@/lib/store";
import { Post } from "@/lib/mockData";

const PAGE_SIZE = 10;

export default function ReviewBoard() {
  const [userPosts, setUserPosts] = useState<StoredPost[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setUserPosts(getUserPosts("review").filter((p) => !p.hidden));
  }, []);

  const mockHidden = getMockOverrides();
  const visibleMock = reviewPosts.filter((p) => !mockHidden[p.id]?.hidden);
  const pinnedIds = new Set(getPinnedPosts().review);
  const allPosts: Post[] = [...(userPosts as unknown as Post[]), ...visibleMock];
  const pinnedPosts = allPosts.filter(p => pinnedIds.has(p.id));
  const normalPosts = allPosts.filter(p => !pinnedIds.has(p.id));
  const totalPages = Math.max(1, Math.ceil(normalPosts.length / PAGE_SIZE));
  const paginated  = normalPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⭐ 후기게시판</h1>
          <p className="text-sm text-gray-500 mt-1">일반회원 이상 작성 가능 | 실제 이용 후기만 작성해주세요</p>
        </div>
        <Link href="/board/review/write"
          className="bg-red-700 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-red-800 transition-colors font-medium">
          후기 작성
        </Link>
      </div>

      {pinnedPosts.length > 0 && (
        <div className="space-y-3 mb-3">
          {pinnedPosts.map((post) => (
            <div key={`pin-${post.id}`} className="relative">
              <span className="absolute -top-1.5 left-3 z-10 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">📌 고정</span>
              <PostCard post={post} showImage />
            </div>
          ))}
          <div className="border-b border-gray-200 mt-2" />
        </div>
      )}

      <div className="space-y-3">
        {paginated.map((post) => (
          <PostCard key={post.id} post={post} showImage />
        ))}
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
