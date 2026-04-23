"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserPosts, updatePost } from "@/lib/store";
import { Category, District, ALL_DISTRICTS } from "@/lib/mockData";
import { MediaItem, detectUrlType } from "@/lib/cloudinary";
import MediaUploader from "@/components/ImageUploader";

const CATEGORIES = [
  { value: "food",     label: "🍜 음식점" },
  { value: "golf",     label: "⛳ 골프"   },
  { value: "hotel",    label: "🏨 숙소"   },
  { value: "rent",     label: "🚗 렌트카" },
  { value: "massage",  label: "💆 마사지" },
  { value: "etc",      label: "📦 기타"   },
];

export default function ReviewEdit() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user } = useAuth();

  const [title, setTitle]             = useState("");
  const [content, setContent]         = useState("");
  const [category, setCategory]       = useState<Category | "">("");
  const [district, setDistrict]       = useState<District | "">("");
  const [rating, setRating]           = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [items, setItems]             = useState<MediaItem[]>([]);
  const [error, setError]             = useState("");
  const [loaded, setLoaded]           = useState(false);

  useEffect(() => {
    const numId = Number(id);
    const post = getUserPosts("review").find((p) => p.id === numId);
    if (!post) { router.replace("/board/review"); return; }
    if (user && user.name !== post.author && user.memberType !== "admin") {
      router.replace(`/board/review/${id}`);
      return;
    }
    setTitle(post.title);
    setContent(post.content);
    if (post.category) setCategory(post.category as Category);
    if (post.district) setDistrict(post.district as District);
    if (post.rating)   setRating(post.rating);
    if (post.imageUrls) {
      setItems(
        post.imageUrls.map((url, i) => ({
          id: `existing-${i}`,
          url,
          type: detectUrlType(url),
        }))
      );
    }
    setLoaded(true);
  }, [id, user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0)  return setError("별점을 선택해주세요.");
    if (!category)     return setError("카테고리를 선택해주세요.");
    if (!district)     return setError("지역을 선택해주세요.");
    if (!title.trim()) return setError("제목을 입력해주세요.");
    if (title.trim().length > 200) return setError("제목은 200자 이내로 입력해주세요.");
    if (!content.trim()) return setError("내용을 입력해주세요.");
    if (content.trim().length > 10000) return setError("내용은 10,000자 이내로 입력해주세요.");
    if (items.some((i) => i.uploading)) return setError("파일 업로드가 완료될 때까지 기다려주세요.");

    const imageUrls = items.filter((i) => !i.error && !i.uploading).map((i) => i.url);

    updatePost(Number(id), {
      title: title.trim(),
      content: content.trim(),
      category: category as Category,
      district: district as District,
      rating,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    });
    router.push(`/board/review/${id}`);
  };

  if (!loaded) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <Link href="/board/review" className="hover:text-red-700">후기게시판</Link>
        <span>/</span>
        <span className="text-gray-700">수정</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">후기 수정</h1>

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
            maxLength={200}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">후기 내용 *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            rows={10}
            maxLength={10000}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none" />
        </div>

        <MediaUploader items={items} onChange={setItems} maxCount={10} label="사진/동영상 첨부" />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <Link href={`/board/review/${id}`} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            취소
          </Link>
          <button type="submit" className="px-5 py-2.5 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
            수정 완료
          </button>
        </div>
      </form>
    </div>
  );
}
