"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Category, District, ALL_DISTRICTS, categoryLabels, categoryIcons } from "@/lib/mockData";

const BOARD_CATEGORIES: { name: string; href: string; icon: string; key: Category }[] = [
  { key: "food",     name: "음식점", href: "/board/promotion?category=food",     icon: "🍜" },
  { key: "golf",     name: "골프",   href: "/board/promotion?category=golf",     icon: "⛳" },
  { key: "hotel",    name: "숙소",   href: "/board/promotion?category=hotel",    icon: "🏨" },
  { key: "rent",     name: "렌트카", href: "/board/promotion?category=rent",     icon: "🚗" },
  { key: "exchange", name: "환전",   href: "/board/promotion?category=exchange", icon: "💱" },
  { key: "etc",      name: "기타",   href: "/board/promotion?category=etc",      icon: "📦" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<District | "all">("all");
  const [desktopQuery, setDesktopQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setMobileOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const canRegisterBusiness = user?.memberType === "business" || user?.memberType === "admin";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory(cat);
    const params = new URLSearchParams({ category: cat });
    if (activeDistrict !== "all") params.set("district", activeDistrict);
    router.push(`/board/promotion?${params.toString()}`);
  };

  const handleDistrictClick = (dist: District | "all") => {
    setActiveDistrict(dist);
    if (activeCategory) {
      const params = new URLSearchParams({ category: activeCategory });
      if (dist !== "all") params.set("district", dist);
      router.push(`/board/promotion?${params.toString()}`);
    }
  };

  const handleBoardClick = () => {
    setActiveCategory(null);
  };

  // 지역 행: activeCategory가 있을 때만 표시
  const showDistrictRow = activeCategory !== null;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* 상단 바 */}
      <div className="bg-red-700 text-white text-xs py-1">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <span>🇻🇳 호치민 한인 커뮤니티 베트남인포</span>
          <div className="flex gap-4">
            {user ? (
              <>
                <span className="text-yellow-300">{user.name}</span>
                <Link href="/mypage" className="hover:text-yellow-300 transition-colors">마이페이지</Link>
                <button onClick={handleLogout} className="hover:text-yellow-300 transition-colors">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-yellow-300 transition-colors">로그인</Link>
                <Link href="/auth/register" className="hover:text-yellow-300 transition-colors">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 메인 헤더 */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-red-700 text-white font-bold text-xl px-3 py-1 rounded">
            베트남인포
          </div>
          <span className="text-gray-500 text-sm hidden sm:block">Ho Chi Minh Community</span>
        </Link>

        {/* 검색창 (데스크탑) */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="flex w-full border border-gray-300 rounded-lg overflow-hidden">
            <input
              type="text"
              value={desktopQuery}
              onChange={(e) => setDesktopQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(desktopQuery)}
              placeholder="업체명, 지역으로 검색..."
              className="flex-1 px-4 py-2 text-sm outline-none"
            />
            <button
              onClick={() => handleSearch(desktopQuery)}
              className="bg-red-700 text-white px-4 py-2 text-sm hover:bg-red-800 transition-colors"
            >
              검색
            </button>
          </div>
        </div>

        {/* 업소 등록 버튼 */}
        {canRegisterBusiness && (
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/register?type=business"
              className="bg-yellow-500 text-gray-900 text-sm px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              업소 등록
            </Link>
          </div>
        )}

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobileOpen}
        >
          <div className="space-y-1.5">
            <span className="block w-6 h-0.5 bg-gray-600"></span>
            <span className="block w-6 h-0.5 bg-gray-600"></span>
            <span className="block w-6 h-0.5 bg-gray-600"></span>
          </div>
        </button>
      </div>

      {/* 데스크탑 카테고리 네비게이션 */}
      <nav className="border-t border-gray-100 hidden md:block">
        <div className="max-w-6xl mx-auto px-4">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href="/board/promotion"
                onClick={handleBoardClick}
                className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                홍보게시판
              </Link>
            </li>
            <li>
              <Link
                href="/board/free"
                onClick={handleBoardClick}
                className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                자유게시판
              </Link>
            </li>
            <li>
              <Link
                href="/board/review"
                onClick={handleBoardClick}
                className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                후기게시판
              </Link>
            </li>
            <li className="h-5 w-px bg-gray-200 mx-1" />
            {BOARD_CATEGORIES.map((cat) => (
              <li key={cat.key}>
                <button
                  onClick={() => handleCategoryClick(cat.key)}
                  className={`flex items-center gap-1 px-3 py-3 text-sm transition-colors ${
                    activeCategory === cat.key
                      ? "text-red-700 font-semibold bg-red-50"
                      : "text-gray-600 hover:text-red-700 hover:bg-red-50"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              </li>
            ))}
            <li className="h-5 w-px bg-gray-200 mx-1" />
            <li>
              <Link
                href="/nearby"
                className="flex items-center gap-1 px-3 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
              >
                <span>🗺️</span>
                <span>주변업소찾기</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* 데스크탑 지역 필터 행 */}
      {showDistrictRow && (
        <div className="hidden md:block border-t border-gray-100 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-gray-500 flex-shrink-0">지역</span>
            <button
              onClick={() => handleDistrictClick("all")}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeDistrict === "all" ? "bg-red-700 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-red-50"
              }`}
            >
              전체
            </button>
            {ALL_DISTRICTS.map((d) => (
              <button
                key={d}
                onClick={() => handleDistrictClick(d)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeDistrict === d ? "bg-red-700 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-red-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {/* 검색창 (모바일) */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden mb-3">
              <input
                type="text"
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(mobileQuery)}
                placeholder="검색..."
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => handleSearch(mobileQuery)}
                className="bg-red-700 text-white px-3 py-2 text-sm"
              >
                검색
              </button>
            </div>

            {/* 게시판 */}
            <div className="grid grid-cols-3 gap-1">
              <Link href="/board/promotion" className="text-center px-2 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 rounded-lg" onClick={() => { setMobileOpen(false); handleBoardClick(); }}>홍보게시판</Link>
              <Link href="/board/free" className="text-center px-2 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 rounded-lg" onClick={() => { setMobileOpen(false); handleBoardClick(); }}>자유게시판</Link>
              <Link href="/board/review" className="text-center px-2 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 rounded-lg" onClick={() => { setMobileOpen(false); handleBoardClick(); }}>후기게시판</Link>
            </div>

            {/* 카테고리 */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="grid grid-cols-6 gap-1">
                {BOARD_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryClick(cat.key)}
                    className={`flex flex-col items-center gap-1 px-1 py-2 text-xs rounded-lg transition-colors ${
                      activeCategory === cat.key
                        ? "bg-red-50 text-red-700 font-semibold"
                        : "text-gray-600 hover:bg-red-50"
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 모바일 지역 필터 */}
            {showDistrictRow && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-xs font-semibold text-gray-500 mb-2">지역 선택</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleDistrictClick("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeDistrict === "all" ? "bg-red-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-red-50"
                    }`}
                  >
                    전체
                  </button>
                  {ALL_DISTRICTS.map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDistrictClick(d)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeDistrict === d ? "bg-red-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-red-50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 주변업소찾기 */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <Link href="/nearby" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                <span>🗺️</span>
                <span>주변업소찾기</span>
              </Link>
            </div>

            {/* 업소 등록 */}
            {canRegisterBusiness && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <Link href="/auth/register?type=business" className="block w-full text-center bg-yellow-500 text-white text-sm px-4 py-2 rounded-lg font-medium" onClick={() => setMobileOpen(false)}>
                  업소 등록
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
