"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/PostCard";
import { promotionPosts, freePosts, reviewPosts, Post } from "@/lib/mockData";
import { getUserPosts, StoredPost } from "@/lib/store";

const MOCK_POSTS: Post[] = [...promotionPosts, ...freePosts, ...reviewPosts];

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const [userPosts, setUserPosts] = useState<StoredPost[]>([]);

  useEffect(() => {
    setUserPosts(getUserPosts());
  }, []);

  const allPosts: Post[] = [...(userPosts as unknown as Post[]), ...MOCK_POSTS];

  const results = q
    ? allPosts.filter((p) => {
        const keyword = q.toLowerCase();
        return (
          p.title.toLowerCase().includes(keyword) ||
          p.content.toLowerCase().includes(keyword) ||
          p.author.toLowerCase().includes(keyword) ||
          p.district?.toLowerCase().includes(keyword) ||
          (p.category && p.category.toLowerCase().includes(keyword))
        );
      })
    : [];

  const promotion = results.filter((p) => p.type === "promotion");
  const free      = results.filter((p) => p.type === "free");
  const review    = results.filter((p) => p.type === "review");

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          검색 결과
          {q && <span className="text-red-700 ml-2">&ldquo;{q}&rdquo;</span>}
        </h1>
        {q && (
          <p className="text-sm text-gray-500 mt-1">
            총 <span className="font-semibold text-gray-800">{results.length}건</span>이 검색되었습니다.
          </p>
        )}
      </div>

      {!q && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>검색어를 입력해주세요.</p>
        </div>
      )}

      {q && results.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">😥</p>
          <p className="font-medium">&ldquo;{q}&rdquo;에 대한 검색 결과가 없습니다.</p>
          <p className="text-sm mt-1">다른 검색어를 시도해 보세요.</p>
        </div>
      )}

      {promotion.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            🏪 홍보게시판
            <span className="text-xs font-normal text-gray-400">{promotion.length}건</span>
          </h2>
          <div className="space-y-2">
            {promotion.map((post) => (
              <PostCard key={post.id} post={post} showImage />
            ))}
          </div>
        </section>
      )}

      {free.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            💬 자유게시판
            <span className="text-xs font-normal text-gray-400">{free.length}건</span>
          </h2>
          <div className="space-y-2">
            {free.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {review.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            ⭐ 후기게시판
            <span className="text-xs font-normal text-gray-400">{review.length}건</span>
          </h2>
          <div className="space-y-2">
            {review.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
