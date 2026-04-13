"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { promotionPosts, categoryLabels, categoryIcons, Category, District, Post } from "@/lib/mockData";
import { getUserPosts, StoredPost } from "@/lib/store";

function PromotionBoard() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") as Category | null;
  const district = searchParams.get("district") as District | null;
  const [userPosts, setUserPosts] = useState<StoredPost[]>([]);

  useEffect(() => {
    setUserPosts(getUserPosts("promotion"));
  }, []);

  const selectedCategory = category ?? "all";
  const selectedDistrict = district ?? "all";

  const allPosts: Post[] = [...(userPosts as unknown as Post[]), ...promotionPosts];

  const premiumPosts = allPosts.filter((p) => {
    if (!p.isPaid) return false;
    return selectedCategory === "all" || p.category === selectedCategory;
  });

  const regularPosts = allPosts.filter((p) => {
    if (p.isPaid) return false;
    const catOk = selectedCategory === "all" || p.category === selectedCategory;
    const distOk = selectedDistrict === "all" || p.district === selectedDistrict;
    return catOk && distOk;
  });

  const categoryLabel = selectedCategory !== "all"
    ? `${categoryIcons[selectedCategory]} ${categoryLabels[selectedCategory]}`
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🏪 홍보게시판
            {categoryLabel && (
              <span className="ml-2 text-lg text-red-700">{categoryLabel}</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">업소회원만 작성 가능 | 전체 열람 가능</p>
        </div>
        <Link
          href="/board/promotion/write"
          className="bg-red-700 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-red-800 transition-colors font-medium"
        >
          업체 등록
        </Link>
      </div>

      {/* 카테고리별 프리미엄 광고 */}
      {premiumPosts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-yellow-600">⭐ 프리미엄 광고</span>
            {selectedCategory !== "all" && (
              <span className="text-xs text-gray-400">
                — {categoryLabels[selectedCategory]} 카테고리
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {premiumPosts.map((post) => (
              <PostCard key={post.id} post={post} showImage />
            ))}
          </div>
          <div className="border-b border-gray-200 mt-6 mb-4" />
        </div>
      )}

      {/* 일반 게시글 목록 */}
      <div className="space-y-2">
        {regularPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">해당 조건의 업체가 없습니다.</p>
          </div>
        ) : (
          regularPosts.map((post) => (
            <PostCard key={post.id} post={post} showImage />
          ))
        )}
      </div>
    </div>
  );
}

export default function PromotionPage() {
  return (
    <Suspense>
      <PromotionBoard />
    </Suspense>
  );
}
