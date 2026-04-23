"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserPosts, updatePost, StoredPost } from "@/lib/store";
import { Category, District } from "@/lib/mockData";
import { MediaItem, detectUrlType } from "@/lib/cloudinary";
import MediaUploader from "@/components/ImageUploader";

const categories = [
  { value: "food",     label: "🍜 음식점" },
  { value: "golf",     label: "⛳ 골프"   },
  { value: "hotel",    label: "🏨 숙소"   },
  { value: "rent",     label: "🚗 렌트카" },
  { value: "massage",  label: "💆 마사지" },
  { value: "etc",      label: "📦 기타"   },
];

const districts = ["1군", "2군", "3군", "4군", "5군", "6군", "7군", "8군", "9군", "기타"];

const contactTypes = [
  { value: "phone",    label: "전화번호",   icon: "📞", placeholder: "+84 28 1234 5678" },
  { value: "kakao",    label: "카카오톡",   icon: "💛", placeholder: "카카오톡 ID" },
  { value: "telegram", label: "텔레그램",   icon: "✈️",  placeholder: "@텔레그램 아이디" },
  { value: "zalo",     label: "잘로(Zalo)", icon: "🔵", placeholder: "Zalo 번호" },
];

type ContactType = "phone" | "kakao" | "telegram" | "zalo";

export default function PromotionEdit() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user } = useAuth();

  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [contacts, setContacts] = useState<Record<ContactType, string>>({
    phone: "", kakao: "", telegram: "", zalo: "",
  });
  const [items, setItems]   = useState<MediaItem[]>([]);
  const [error, setError]   = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const numId = Number(id);
    const post = getUserPosts("promotion").find((p) => p.id === numId);
    if (!post) { router.replace("/board/promotion"); return; }
    if (user && user.name !== post.author && user.memberType !== "admin") {
      router.replace(`/board/promotion/${id}`);
      return;
    }
    setTitle(post.title);
    setContent(post.content);
    if (post.category) setCategory(post.category);
    if (post.district) setDistrict(post.district);
    if (post.contacts) {
      setContacts({
        phone:    post.contacts.phone    ?? "",
        kakao:    post.contacts.kakao    ?? "",
        telegram: post.contacts.telegram ?? "",
        zalo:     post.contacts.zalo     ?? "",
      });
    }
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

  const updateContact = (type: ContactType, value: string) =>
    setContacts((prev) => ({ ...prev, [type]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category)       return setError("카테고리를 선택해주세요.");
    if (!district)       return setError("지역을 선택해주세요.");
    if (!title.trim())   return setError("업체명을 입력해주세요.");
    if (title.trim().length > 200) return setError("업체명은 200자 이내로 입력해주세요.");
    if (!content.trim()) return setError("업체 소개를 입력해주세요.");
    if (content.trim().length > 10000) return setError("업체 소개는 10,000자 이내로 입력해주세요.");
    if (items.some((i) => i.uploading)) return setError("파일 업로드가 완료될 때까지 기다려주세요.");

    const imageUrls = items.filter((i) => !i.error && !i.uploading).map((i) => i.url);
    const contactsData: StoredPost["contacts"] = {
      phone:    contacts.phone    || undefined,
      kakao:    contacts.kakao    || undefined,
      telegram: contacts.telegram || undefined,
      zalo:     contacts.zalo     || undefined,
    };

    updatePost(Number(id), {
      title: title.trim(),
      content: content.trim(),
      category: category as Category,
      district: district as District,
      contacts: contactsData,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    });
    router.push(`/board/promotion/${id}`);
  };

  if (!loaded) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <Link href="/board/promotion" className="hover:text-red-700">홍보게시판</Link>
        <span>/</span>
        <span className="text-gray-700">수정</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">업체 수정</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리 *</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {categories.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
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
            {districts.map((d) => (
              <button key={d} type="button" onClick={() => setDistrict(d)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  district === d ? "border-red-500 bg-red-50 text-red-700 font-medium" : "border-gray-200 text-gray-600 hover:border-red-300"
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* 업체명 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">업체명 *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" />
        </div>

        {/* 업체 소개 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">업체 소개 *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            rows={6}
            maxLength={10000}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none" />
        </div>

        {/* 연락처 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">업소 연락처</label>
          <div className="space-y-2">
            {contactTypes.map((ct) => (
              <div key={ct.value} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                  <span className="text-lg">{ct.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{ct.label}</span>
                </div>
                <input type="text" value={contacts[ct.value as ContactType]}
                  onChange={(e) => updateContact(ct.value as ContactType, e.target.value)}
                  placeholder={ct.placeholder}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" />
              </div>
            ))}
          </div>
        </div>

        {/* 사진/동영상 */}
        <MediaUploader items={items} onChange={setItems} maxCount={10} label="대표 사진/동영상" />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <Link href={`/board/promotion/${id}`} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
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
