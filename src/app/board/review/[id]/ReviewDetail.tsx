"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { reviewPosts, gradeColors, categoryLabels, categoryIcons, Post } from "@/lib/mockData";
import { getUserPosts } from "@/lib/store";
import PostInteractions from "@/components/PostInteractions";
import ImageGallery from "@/components/ImageGallery";

type PostWithImages = Post & { imageUrls?: string[] };

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostWithImages | null>(null);

  useEffect(() => {
    const numId = Number(id);
    const mock  = reviewPosts.find((p) => p.id === numId);
    if (mock) { setPost(mock); return; }
    const user  = getUserPosts("review").find((p) => p.id === numId);
    if (user) { setPost(user as unknown as PostWithImages); return; }
  }, [id]);

  if (post === null) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <Link href="/board/review" className="hover:text-red-700">후기게시판</Link>
        <span>/</span>
        <span className="text-gray-700 truncate">{post.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
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

          {post.rating && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl text-yellow-400">{"★".repeat(post.rating)}{"☆".repeat(5 - post.rating)}</span>
              <span className="text-sm text-gray-500">{post.rating}/5</span>
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                {post.author[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{post.author}</span>
                  {post.authorGrade && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${gradeColors[post.authorGrade]}`}>
                      {post.authorGrade}
                    </span>
                  )}
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

        <div className="p-6 min-h-40 space-y-5">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.imageUrls && post.imageUrls.length > 0 && (
            <ImageGallery images={post.imageUrls} />
          )}
        </div>

        <div className="px-6 pb-6">
          <PostInteractions postId={post.id} baseLikes={post.likes} baseCommentCount={0} backHref="/board/review" />
        </div>
      </div>
    </div>
  );
}
