"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addPost } from "@/lib/store";
import { Category, District, ALL_DISTRICTS } from "@/lib/mockData";
import ImageUploader from "@/components/ImageUploader";

const CATEGORIES = [
  { value: "food",     label: "🍜 음식점" },
  { value: "golf",     label: "⛳ 골프"   },
  { value: "hotel",    label: "🏨 숙소"   },
  { value: "rent",     label: "🚗 렌트카" },
  { value: "exchange", label: "💱 환전"   },
  { value: "etc",      label: "📦 기타"   },
];

export default function ReviewWrite() {
  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [category, setCategory]     = useState<Category | "">("");
  const [district, setDistrict]     = useState<District | "">("");
  const [rating, setRating]         = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [images, setImages]         = useState<string[]>([]);
  const [error, setError]           = useState("");

  const { user } = useAuth();
  const router   = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0)       return setError("별점을 선택해주세요.");
    if (!category)          return setError("카테고리를 선택해주세요.");
    if (!district)          return setError("지역을 선택해주세요.");
    if (!title.trim())      return setError("제목을 입력해주세요.");
    if (!content.trim())    return setError("후기 내용을 입력해주세요.");

    addPost({
      type: "review",
      title: title.trim(),
      content: content.trim(),
      author: user?.name ?? "익명",
      category: category as Category,
      district: district as District,
      rating,
      imageUrls: images.length > 0 ? images : undefined,
    });

    router.push("/board/review");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <Link href="/board/review" className="hover:text-red-700">후기게시판</Link>
        <span>/</span>
        <span className="text-gray-700">후기 작성</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">후기 작성</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* 별점 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">별점 *</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-3xl transition-colors">
                <span className={(hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-300"}>★</span>
              </button>
            ))}
            {rating > 0 && <span className="text-sm text-gray-500 ml-2 self-center">{rating}점</span>}
          </div>
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리 *</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value as Category)}
                className={`py-2 px-2 text-xs rounded-lg border transition-colors ${
                  category === cat.value ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-red-300"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">지역 *</label>
          <div className="flex flex-wrap gap-2">
            {ALL_DISTRICTS.map((d) => (
              <button key={d} type="button" onClick={() => setDistrict(d)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  district === d ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-red-300"
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">제목 *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="후기 제목을 입력하세요"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">후기 내용 *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="실제 이용 경험을 솔직하게 작성해주세요..."
            rows={10}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none" />
        </div>

        {/* 사진 */}
        <ImageUploader
          images={images}
          onChange={setImages}
          maxCount={5}
          label="사진 첨부"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <Link href="/board/review" className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
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
