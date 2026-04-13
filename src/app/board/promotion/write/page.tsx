"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addPost } from "@/lib/store";
import { Category, District } from "@/lib/mockData";
import ImageUploader from "@/components/ImageUploader";

const categories = [
  { value: "food", label: "🍜 음식점" },
  { value: "golf", label: "⛳ 골프" },
  { value: "hotel", label: "🏨 숙소" },
  { value: "rent", label: "🚗 렌트카" },
  { value: "exchange", label: "💱 환전" },
  { value: "etc", label: "📦 기타" },
];

const districts = ["1군", "2군", "3군", "4군", "5군", "6군", "7군", "8군", "9군", "기타"];

const contactTypes = [
  { value: "phone",    label: "전화번호",   icon: "📞", placeholder: "+84 28 1234 5678" },
  { value: "kakao",    label: "카카오톡",   icon: "💛", placeholder: "카카오톡 ID" },
  { value: "telegram", label: "텔레그램",   icon: "✈️", placeholder: "@텔레그램 아이디" },
  { value: "zalo",     label: "잘로(Zalo)", icon: "🔵", placeholder: "Zalo 번호" },
];

type ContactType = "phone" | "kakao" | "telegram" | "zalo";

/* ────────── 음식점: 메뉴판 이미지 업로드 ────────── */
function FoodSection() {
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files)
      .slice(0, 10 - previews.length)
      .map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  const remove = (idx: number) => setPreviews((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-orange-800 text-sm flex items-center gap-1.5">🍜 메뉴판 사진 등록</h3>
      <p className="text-xs text-orange-600">메뉴판, 음식 사진을 올려주세요. (최대 10장)</p>

      {/* 미리보기 그리드 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >✕</button>
            </div>
          ))}
          {previews.length < 10 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-orange-300 flex items-center justify-center text-orange-400 hover:bg-orange-100 transition-colors text-2xl"
            >+</button>
          )}
        </div>
      )}

      {previews.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center cursor-pointer hover:bg-orange-100 transition-colors"
        >
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm text-orange-700 font-medium">메뉴판 사진 업로드</p>
          <p className="text-xs text-orange-500 mt-1">JPG, PNG (최대 10장)</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

/* ────────── 골프: 비용 정보 폼 ────────── */
type GolfCourse = { name: string; weekday: string; weekend: string; caddie: string; cart: string; note: string };

function GolfSection() {
  const [courses, setCourses] = useState<GolfCourse[]>([
    { name: "", weekday: "", weekend: "", caddie: "", cart: "", note: "" },
  ]);
  const [extraInfo, setExtraInfo] = useState("");
  const [priceImage, setPriceImage] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const addCourse = () => setCourses((p) => [...p, { name: "", weekday: "", weekend: "", caddie: "", cart: "", note: "" }]);
  const removeCourse = (i: number) => setCourses((p) => p.filter((_, idx) => idx !== i));
  const updateCourse = (i: number, key: keyof GolfCourse, val: string) =>
    setCourses((p) => p.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));

  return (
    <div className="border border-green-200 bg-green-50 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-green-800 text-sm flex items-center gap-1.5">⛳ 골프장 비용 정보</h3>

      {courses.map((course, i) => (
        <div key={i} className="bg-white rounded-xl border border-green-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-green-700">코스 {i + 1}</span>
            {courses.length > 1 && (
              <button type="button" onClick={() => removeCourse(i)} className="text-xs text-gray-400 hover:text-red-500">삭제</button>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">골프장/코스명</label>
            <input type="text" value={course.name} onChange={(e) => updateCourse(i, "name", e.target.value)}
              placeholder="예) 롱탄 골프장 A코스"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">평일 요금</label>
              <div className="relative">
                <input type="text" value={course.weekday} onChange={(e) => updateCourse(i, "weekday", e.target.value)}
                  placeholder="예) $80"
                  className="w-full border border-gray-200 rounded-lg pl-3 pr-3 py-2 text-sm focus:outline-none focus:border-green-400" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">주말/공휴일 요금</label>
              <input type="text" value={course.weekend} onChange={(e) => updateCourse(i, "weekend", e.target.value)}
                placeholder="예) $100"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">캐디피</label>
              <input type="text" value={course.caddie} onChange={(e) => updateCourse(i, "caddie", e.target.value)}
                placeholder="예) $20 (포함/별도)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">카트피</label>
              <input type="text" value={course.cart} onChange={(e) => updateCourse(i, "cart", e.target.value)}
                placeholder="예) $15 (포함/별도)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">기타 메모</label>
            <input type="text" value={course.note} onChange={(e) => updateCourse(i, "note", e.target.value)}
              placeholder="예) 샤워시설 포함, 클럽 렌탈 가능 등"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>
        </div>
      ))}

      <button type="button" onClick={addCourse}
        className="w-full border-2 border-dashed border-green-300 text-green-600 text-sm py-2.5 rounded-xl hover:bg-green-100 transition-colors">
        + 코스 추가
      </button>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">추가 안내 (자유 입력)</label>
        <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)}
          placeholder="예약 방법, 픽업 서비스, 그룹 할인 등..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none bg-white" />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">가격표 이미지 첨부 (선택)</label>
        {priceImage ? (
          <div className="relative inline-block">
            <img src={priceImage} alt="가격표" className="max-h-48 rounded-lg border border-gray-200" />
            <button type="button" onClick={() => setPriceImage(null)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✕</button>
          </div>
        ) : (
          <div onClick={() => imgRef.current?.click()}
            className="border-2 border-dashed border-green-300 rounded-xl p-4 text-center cursor-pointer hover:bg-green-100 transition-colors">
            <p className="text-sm text-green-600">📄 가격표 이미지 업로드</p>
          </div>
        )}
        <input ref={imgRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setPriceImage(URL.createObjectURL(f)); }} />
      </div>
    </div>
  );
}

/* ────────── 숙소: 객실 요금 폼 ────────── */
type RoomType = { name: string; size: string; price: string; weekend: string; includes: string; note: string };

function HotelSection() {
  const [rooms, setRooms] = useState<RoomType[]>([
    { name: "", size: "", price: "", weekend: "", includes: "", note: "" },
  ]);
  const [priceImage, setPriceImage] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const addRoom = () => setRooms((p) => [...p, { name: "", size: "", price: "", weekend: "", includes: "", note: "" }]);
  const removeRoom = (i: number) => setRooms((p) => p.filter((_, idx) => idx !== i));
  const updateRoom = (i: number, key: keyof RoomType, val: string) =>
    setRooms((p) => p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-blue-800 text-sm flex items-center gap-1.5">🏨 객실 요금 정보</h3>

      {rooms.map((room, i) => (
        <div key={i} className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">객실 유형 {i + 1}</span>
            {rooms.length > 1 && (
              <button type="button" onClick={() => removeRoom(i)} className="text-xs text-gray-400 hover:text-red-500">삭제</button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">객실 유형</label>
              <input type="text" value={room.name} onChange={(e) => updateRoom(i, "name", e.target.value)}
                placeholder="예) 스튜디오 / 1베드룸"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">면적</label>
              <input type="text" value={room.size} onChange={(e) => updateRoom(i, "size", e.target.value)}
                placeholder="예) 35㎡"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">1박 요금 (평일)</label>
              <input type="text" value={room.price} onChange={(e) => updateRoom(i, "price", e.target.value)}
                placeholder="예) $50 / 1,200,000 VND"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">1박 요금 (주말)</label>
              <input type="text" value={room.weekend} onChange={(e) => updateRoom(i, "weekend", e.target.value)}
                placeholder="예) $60 / 1,400,000 VND"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">포함 서비스</label>
            <input type="text" value={room.includes} onChange={(e) => updateRoom(i, "includes", e.target.value)}
              placeholder="예) 조식 포함, 수영장, 주차 무료"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">기타 메모</label>
            <input type="text" value={room.note} onChange={(e) => updateRoom(i, "note", e.target.value)}
              placeholder="예) 장기 투숙 할인, 픽업 서비스 가능"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        </div>
      ))}

      <button type="button" onClick={addRoom}
        className="w-full border-2 border-dashed border-blue-300 text-blue-600 text-sm py-2.5 rounded-xl hover:bg-blue-100 transition-colors">
        + 객실 유형 추가
      </button>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">요금표 이미지 첨부 (선택)</label>
        {priceImage ? (
          <div className="relative inline-block">
            <img src={priceImage} alt="요금표" className="max-h-48 rounded-lg border border-gray-200" />
            <button type="button" onClick={() => setPriceImage(null)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✕</button>
          </div>
        ) : (
          <div onClick={() => imgRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-100 transition-colors">
            <p className="text-sm text-blue-600">📄 요금표 이미지 업로드</p>
          </div>
        )}
        <input ref={imgRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setPriceImage(URL.createObjectURL(f)); }} />
      </div>
    </div>
  );
}

/* ────────── 렌트카: 차량/요금 폼 ────────── */
type CarType = { name: string; seats: string; dayRate: string; halfDay: string; driver: string; note: string };

function RentSection() {
  const [cars, setCars] = useState<CarType[]>([
    { name: "", seats: "", dayRate: "", halfDay: "", driver: "", note: "" },
  ]);
  const [priceImage, setPriceImage] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const addCar = () => setCars((p) => [...p, { name: "", seats: "", dayRate: "", halfDay: "", driver: "", note: "" }]);
  const removeCar = (i: number) => setCars((p) => p.filter((_, idx) => idx !== i));
  const updateCar = (i: number, key: keyof CarType, val: string) =>
    setCars((p) => p.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));

  return (
    <div className="border border-purple-200 bg-purple-50 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-purple-800 text-sm flex items-center gap-1.5">🚗 차량 요금 정보</h3>

      {cars.map((car, i) => (
        <div key={i} className="bg-white rounded-xl border border-purple-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700">차량 {i + 1}</span>
            {cars.length > 1 && (
              <button type="button" onClick={() => removeCar(i)} className="text-xs text-gray-400 hover:text-red-500">삭제</button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">차량 종류</label>
              <input type="text" value={car.name} onChange={(e) => updateCar(i, "name", e.target.value)}
                placeholder="예) 오토바이 / 4인승 / 미니버스"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">탑승 인원</label>
              <input type="text" value={car.seats} onChange={(e) => updateCar(i, "seats", e.target.value)}
                placeholder="예) 최대 4명"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">1일 요금</label>
              <input type="text" value={car.dayRate} onChange={(e) => updateCar(i, "dayRate", e.target.value)}
                placeholder="예) $30 / 700,000 VND"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">반일 요금</label>
              <input type="text" value={car.halfDay} onChange={(e) => updateCar(i, "halfDay", e.target.value)}
                placeholder="예) $18 / 4시간"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">기사 포함 요금</label>
            <input type="text" value={car.driver} onChange={(e) => updateCar(i, "driver", e.target.value)}
              placeholder="예) +$15/일 (기사 포함 시)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">기타 안내</label>
            <input type="text" value={car.note} onChange={(e) => updateCar(i, "note", e.target.value)}
              placeholder="예) 보험 포함, 연료비 별도, 공항 픽업 가능"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
          </div>
        </div>
      ))}

      <button type="button" onClick={addCar}
        className="w-full border-2 border-dashed border-purple-300 text-purple-600 text-sm py-2.5 rounded-xl hover:bg-purple-100 transition-colors">
        + 차량 추가
      </button>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">요금표 이미지 첨부 (선택)</label>
        {priceImage ? (
          <div className="relative inline-block">
            <img src={priceImage} alt="요금표" className="max-h-48 rounded-lg border border-gray-200" />
            <button type="button" onClick={() => setPriceImage(null)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✕</button>
          </div>
        ) : (
          <div onClick={() => imgRef.current?.click()}
            className="border-2 border-dashed border-purple-300 rounded-xl p-4 text-center cursor-pointer hover:bg-purple-100 transition-colors">
            <p className="text-sm text-purple-600">📄 요금표 이미지 업로드</p>
          </div>
        )}
        <input ref={imgRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setPriceImage(URL.createObjectURL(f)); }} />
      </div>
    </div>
  );
}

/* ────────── 메인 폼 ────────── */
export default function PromotionWrite() {
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [contacts, setContacts] = useState<Record<ContactType, string>>({
    phone: "", kakao: "", telegram: "", zalo: "",
  });
  const [images, setImages]       = useState<string[]>([]);
  const [error, setError]         = useState("");
  const [showAdInfo, setShowAdInfo] = useState(false);
  const { user } = useAuth();
  const router   = useRouter();

  const updateContact = (type: ContactType, value: string) =>
    setContacts((prev) => ({ ...prev, [type]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category)       return setError("카테고리를 선택해주세요.");
    if (!district)       return setError("지역을 선택해주세요.");
    if (!title.trim())   return setError("업체명을 입력해주세요.");
    if (!content.trim()) return setError("업체 소개를 입력해주세요.");

    addPost({
      type: "promotion",
      title: title.trim(),
      content: content.trim(),
      author: user?.name ?? "익명",
      category: category as Category,
      district: district as District,
      contacts: {
        phone:    contacts.phone    || undefined,
        kakao:    contacts.kakao    || undefined,
        telegram: contacts.telegram || undefined,
        zalo:     contacts.zalo     || undefined,
      },
      imageUrls: images.length > 0 ? images : undefined,
    });

    router.push("/board/promotion");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-red-700">홈</Link>
        <span>/</span>
        <Link href="/board/promotion" className="hover:text-red-700">홍보게시판</Link>
        <span>/</span>
        <span className="text-gray-700">업체 등록</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">업체 등록</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리 *</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {categories.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className={`py-2 px-2 text-xs rounded-lg border transition-colors ${
                  category === cat.value
                    ? "border-red-500 bg-red-50 text-red-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-red-300"
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
                  district === d
                    ? "border-red-500 bg-red-50 text-red-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-red-300"
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
            placeholder="업체명을 입력하세요"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" />
        </div>

        {/* 업체 소개 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">업체 소개 *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="업체 소개를 입력하세요..."
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none" />
        </div>

        {/* ── 카테고리별 추가 폼 ── */}
        {category === "food"  && <FoodSection />}
        {category === "golf"  && <GolfSection />}
        {category === "hotel" && <HotelSection />}
        {category === "rent"  && <RentSection />}

        {/* 업소 연락처 */}
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
          <p className="text-xs text-gray-400 mt-2">해당하는 연락처만 입력하세요.</p>
        </div>

        {/* 대표 사진 업로드 */}
        <ImageUploader
          images={images}
          onChange={setImages}
          maxCount={5}
          label="대표 사진 업로드"
        />

        {/* 유료광고 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 text-sm mb-2">💡 유료광고 신청 시 혜택</h3>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>✅ 메인 페이지 상단 배너 노출</li>
            <li>✅ 홍보게시판 최상단 고정</li>
            <li>✅ 프리미엄 마크 표시</li>
          </ul>
          <button
            type="button"
            onClick={() => setShowAdInfo((v) => !v)}
            className="mt-3 text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            유료광고 문의하기
          </button>
          {showAdInfo && (
            <div className="mt-3 bg-white border border-yellow-300 rounded-lg p-3 text-xs text-gray-700 space-y-1">
              <p>📞 카카오톡: <span className="font-medium">@vietnaminfo</span></p>
              <p>✈️ 텔레그램: <span className="font-medium">@vietnaminfo_ad</span></p>
              <p className="text-gray-400 mt-1">문의 시 업소명과 카테고리를 함께 알려주세요.</p>
            </div>
          )}
        </div>

        {/* 에러 */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* 버튼 */}
        <div className="flex gap-3 justify-end pt-2">
          <Link href="/board/promotion"
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            취소
          </Link>
          <button type="submit"
            className="px-5 py-2.5 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
            등록하기
          </button>
        </div>
      </form>
    </div>
  );
}
