"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addPost } from "@/lib/store";
import { POINT_REWARDS } from "@/lib/points";
import ImageUploader from "@/components/ImageUploader";

export default function FreeWrite() {
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [images, setImages]     = useState<string[]>([]);
  const [error, setError]       = useState("");
  const { user, awardPoints } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("제목을 입력해주세요.");
    if (title.trim().length > 200) return setError("제목은 200자 이내로 입력해주세요.");
    if (!content.trim()) return setError("내용을 입력해주세요.");
    if (content.trim().length > 10000) return setError("내용은 10,000자 이내로 입력해주세요.");

    addPost({
      type: "free",
      title: title.trim(),
      content: content.trim(),
      author: user?.name ?? "익명",
      imageUrls: images.length > 0 ? images : undefined,
    });
    awardPoints(POINT_REWARDS.post);
    router.push("/board/free");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <Link href="/board/free" className="hover:text-red-700">자유게시판</Link>
        <span>/</span>
        <span className="text-gray-700">글쓰기</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">글쓰기</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={200}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">내용 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요..."
            rows={12}
            maxLength={10000}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"
          />
        </div>

        <ImageUploader
          images={images}
          onChange={setImages}
          maxCount={5}
          label="사진 첨부"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <Link href="/board/free" className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            취소
          </Link>
          <button type="submit" className="px-5 py-2.5 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
            등록하기
          </button>
        </div>
      </form>
    </div>
  );
}
