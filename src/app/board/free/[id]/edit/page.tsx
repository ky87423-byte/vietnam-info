"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserPosts, updatePost } from "@/lib/store";
import { MediaItem, detectUrlType } from "@/lib/cloudinary";
import MediaUploader from "@/components/ImageUploader";

export default function FreeEdit() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user } = useAuth();

  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [items, setItems]     = useState<MediaItem[]>([]);
  const [error, setError]     = useState("");
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    const numId = Number(id);
    const post = getUserPosts("free").find((p) => p.id === numId);
    if (!post) { router.replace("/board/free"); return; }
    if (user && user.name !== post.author && user.memberType !== "admin") {
      router.replace(`/board/free/${id}`);
      return;
    }
    setTitle(post.title);
    setContent(post.content);
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
    if (!title.trim()) return setError("제목을 입력해주세요.");
    if (title.trim().length > 200) return setError("제목은 200자 이내로 입력해주세요.");
    if (!content.trim()) return setError("내용을 입력해주세요.");
    if (content.trim().length > 10000) return setError("내용은 10,000자 이내로 입력해주세요.");
    if (items.some((i) => i.uploading)) return setError("파일 업로드가 완료될 때까지 기다려주세요.");

    const imageUrls = items.filter((i) => !i.error && !i.uploading).map((i) => i.url);

    updatePost(Number(id), {
      title: title.trim(),
      content: content.trim(),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    });
    router.push(`/board/free/${id}`);
  };

  if (!loaded) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <Link href="/board/free" className="hover:text-red-700">자유게시판</Link>
        <span>/</span>
        <span className="text-gray-700">수정</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">글 수정</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">내용 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            maxLength={10000}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"
          />
        </div>

        <MediaUploader items={items} onChange={setItems} maxCount={10} label="사진/동영상 첨부" />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <Link href={`/board/free/${id}`} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
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
