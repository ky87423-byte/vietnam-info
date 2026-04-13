import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import PostCard from "@/components/PostCard";
import { promotionPosts, freePosts, reviewPosts, categoryIcons, categoryLabels } from "@/lib/mockData";

const categories = ["food", "golf", "hotel", "rent", "exchange", "etc"] as const;
const districts = ["1군", "2군", "3군", "4군", "5군", "6군", "7군"] as const;

export default function Home() {
  const topPromotion = promotionPosts.filter((p) => p.isPaid);
  const recentPromotion = promotionPosts.slice(0, 4);
  const recentFree = freePosts.slice(0, 4);
  const recentReview = reviewPosts.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">

      {/* 히어로 섹션 */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-700 to-red-900 text-white py-12 px-8">
        <div className="relative z-10">
          <p className="text-red-200 text-sm mb-2">🇻🇳 Ho Chi Minh City Korean Community</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">베트남인포</h1>
          <p className="text-red-100 text-base sm:text-lg mb-6">
            호치민 한인들의 생활 정보 플랫폼<br className="sm:hidden" />
            — 맛집, 골프, 숙소, 렌트카, 환전까지
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/board/promotion"
              className="bg-white text-red-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors"
            >
              업체 둘러보기
            </Link>
            <Link
              href="/auth/register"
              className="bg-yellow-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-yellow-600 transition-colors"
            >
              회원가입
            </Link>
          </div>
        </div>
        <div className="absolute right-4 top-0 h-full flex items-center justify-center opacity-10 text-[120px] select-none pointer-events-none">
          🇻🇳
        </div>
      </section>

      {/* 카테고리 바로가기 */}
      <section className="hidden">
        <h2 className="text-lg font-bold text-gray-800 mb-4">카테고리</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/board/promotion?category=${cat}`}
              className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 py-4 gap-2 hover:border-red-300 hover:shadow-sm transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{categoryIcons[cat]}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-red-700">{categoryLabels[cat]}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 지역 필터 */}
      <section className="hidden">
        <h2 className="text-lg font-bold text-gray-800 mb-4">지역별 검색</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/board/promotion"
            className="px-4 py-2 bg-red-700 text-white text-sm rounded-full font-medium"
          >
            전체
          </Link>
          {districts.map((d) => (
            <Link
              key={d}
              href={`/board/promotion?district=${encodeURIComponent(d)}`}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-200 text-sm rounded-full font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
            >
              {d}
            </Link>
          ))}
        </div>
      </section>

      {/* 메인 컨텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 왼쪽: 게시판들 */}
        <div className="lg:col-span-2 space-y-8">

          {/* 프리미엄 업체 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">⭐ 프리미엄 업체</h2>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">광고</span>
              </div>
              <Link href="/board/promotion" className="text-sm text-red-700 hover:underline">더보기</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topPromotion.map((post) => (
                <PostCard key={post.id} post={post} showImage />
              ))}
            </div>
          </section>

          {/* 홍보게시판 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">🏪 홍보게시판</h2>
              <Link href="/board/promotion" className="text-sm text-red-700 hover:underline">더보기</Link>
            </div>
            <div className="space-y-2">
              {recentPromotion.map((post) => (
                <PostCard key={post.id} post={post} showImage />
              ))}
            </div>
          </section>

          {/* 자유게시판 + 후기게시판 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800">💬 자유게시판</h2>
                <Link href="/board/free" className="text-sm text-red-700 hover:underline">더보기</Link>
              </div>
              <div className="space-y-2">
                {recentFree.map((post) => (
                  <Link key={post.id} href={`/board/free/${post.id}`}>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1 hover:text-red-700">{post.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{post.author}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>👁 {post.views.toLocaleString()}</span>
                          <span>💬 {post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800">⭐ 후기게시판</h2>
                <Link href="/board/review" className="text-sm text-red-700 hover:underline">더보기</Link>
              </div>
              <div className="space-y-2">
                {recentReview.map((post) => (
                  <Link key={post.id} href={`/board/review/${post.id}`}>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1 hover:text-red-700">{post.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-yellow-500">{"★".repeat(post.rating ?? 0)}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>👁 {post.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="space-y-6">
          {/* 유료광고 슬라이더 */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3">📢 이달의 추천 업체</h2>
            <AdBanner />
          </div>

          {/* 회원 등급 안내 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">🏆 회원 등급 안내</h3>
            <div className="space-y-2">
              {[
                { grade: "새싹", desc: "가입 ~ 49포인트", color: "text-green-600" },
                { grade: "일반", desc: "50 ~ 199포인트", color: "text-blue-600" },
                { grade: "우수", desc: "200 ~ 499포인트", color: "text-purple-600" },
                { grade: "전문가", desc: "500 ~ 999포인트", color: "text-orange-600" },
                { grade: "VIP", desc: "1000포인트 이상", color: "text-red-600" },
              ].map(({ grade, desc, color }) => (
                <div key={grade} className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${color}`}>{grade}</span>
                  <span className="text-gray-500 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 업소 등록 안내 */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5">
            <h3 className="font-bold text-gray-800 mb-2 text-sm">💼 업소회원 혜택</h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>✅ 홍보게시판 무제한 등록</li>
              <li>✅ 유료광고 시 이미지+상단 노출</li>
              <li>✅ 카테고리/지역별 분류 노출</li>
              <li>✅ 전화번호, 위치 정보 등록</li>
            </ul>
            <Link
              href="/auth/register?type=business"
              className="mt-4 block w-full text-center bg-yellow-500 text-white text-sm py-2.5 rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
            >
              업소 등록하기
            </Link>
          </div>

          {/* 지역 빠른 링크 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">📍 지역별 업체</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {districts.map((d) => (
                <Link
                  key={d}
                  href={`/board/promotion?district=${encodeURIComponent(d)}`}
                  className="text-center text-xs py-2 bg-gray-50 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
