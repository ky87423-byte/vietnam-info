"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { promotionPosts, categoryLabels, categoryIcons, Post } from "@/lib/mockData";
import { getUserPosts } from "@/lib/store";
import PostInteractions from "@/components/PostInteractions";
import ImageGallery from "@/components/ImageGallery";

type PostWithImages = Post & { imageUrls?: string[] };

export default function PromotionDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostWithImages | null>(null);

  useEffect(() => {
    const numId = Number(id);
    const mock  = promotionPosts.find((p) => p.id === numId);
    if (mock) { setPost(mock); return; }
    const user  = getUserPosts("promotion").find((p) => p.id === numId);
    if (user) { setPost(user as unknown as PostWithImages); return; }
  }, [id]);

  if (post === null) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <Link href="/board/promotion" className="hover:text-red-700">홍보게시판</Link>
        <span>/</span>
        <span className="text-gray-700 truncate">{post.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          {post.isPaid && (
            <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold mb-2">
              <span>⭐</span><span>프리미엄 광고</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {post.category && (
              <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {categoryIcons[post.category]} {categoryLabels[post.category]}
              </span>
            )}
            {post.district && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{post.district}</span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold text-sm">
                {post.author[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{post.author}</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">업소</span>
                </div>
                <span className="text-xs text-gray-400">{post.createdAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>👁 {post.views.toLocaleString()}</span>
              <span>💬 {post.commentCount}</span>
            </div>
          </div>
        </div>

        {/* 대표 이미지 (mockData의 단일 imageUrl) */}
        {post.imageUrl && (
          <div className="w-full h-64 sm:h-80 bg-cover bg-center"
            style={{ backgroundImage: `url(${post.imageUrl})` }} />
        )}

        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* 사용자 업로드 이미지 갤러리 */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="mt-5">
              <ImageGallery images={post.imageUrls} />
            </div>
          )}

          {/* 업체 정보 */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">📋 업체 정보</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500 w-16 flex-shrink-0">상호명</span>
                <span className="text-gray-800 font-medium">{post.author}</span>
              </div>
              {post.category && (
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 flex-shrink-0">카테고리</span>
                  <span className="text-gray-800">{categoryLabels[post.category]}</span>
                </div>
              )}
              {post.district && (
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 flex-shrink-0">지역</span>
                  <span className="text-gray-800">{post.district}</span>
                </div>
              )}
            </div>
          </div>

          {/* 연락처 */}
          {post.contacts && Object.values(post.contacts).some(Boolean) && (
            <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">📞 업소 연락처</h3>
              <div className="space-y-2.5">
                {post.contacts.phone && (
                  <div className="flex items-center gap-3">
                    <span className="w-28 text-sm text-gray-500 flex-shrink-0">📞 전화번호</span>
                    <a href={`tel:${post.contacts.phone}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {post.contacts.phone}
                    </a>
                  </div>
                )}
                {post.contacts.kakao && (
                  <div className="flex items-center gap-3">
                    <span className="w-28 text-sm text-gray-500 flex-shrink-0">💛 카카오톡</span>
                    <span className="text-sm font-medium text-yellow-600">{post.contacts.kakao}</span>
                  </div>
                )}
                {post.contacts.telegram && (
                  <div className="flex items-center gap-3">
                    <span className="w-28 text-sm text-gray-500 flex-shrink-0">✈️ 텔레그램</span>
                    <a href={`https://t.me/${post.contacts.telegram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-500 hover:underline">
                      {post.contacts.telegram}
                    </a>
                  </div>
                )}
                {post.contacts.zalo && (
                  <div className="flex items-center gap-3">
                    <span className="w-28 text-sm text-gray-500 flex-shrink-0">🔵 잘로(Zalo)</span>
                    <span className="text-sm font-medium text-blue-700">{post.contacts.zalo}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <PostInteractions postId={post.id} baseLikes={post.likes} baseCommentCount={0} backHref="/board/promotion" />
        </div>
      </div>
    </div>
  );
}
