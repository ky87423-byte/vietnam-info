import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="bg-red-700 text-white font-bold text-lg px-3 py-1 rounded inline-block mb-3">
              베트남인포
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              호치민 한인 커뮤니티 베트남인포는 베트남 호치민에 거주하는 한국인들을 위한 생활 정보 플랫폼입니다.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              🇻🇳 Ho Chi Minh City, Vietnam
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">게시판</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/board/promotion" className="hover:text-white transition-colors">홍보게시판</Link></li>
              <li><Link href="/board/free" className="hover:text-white transition-colors">자유게시판</Link></li>
              <li><Link href="/board/review" className="hover:text-white transition-colors">후기게시판</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">카테고리</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/board/promotion?category=food" className="hover:text-white transition-colors">🍜 음식점</Link></li>
              <li><Link href="/board/promotion?category=golf" className="hover:text-white transition-colors">⛳ 골프</Link></li>
              <li><Link href="/board/promotion?category=hotel" className="hover:text-white transition-colors">🏨 숙소</Link></li>
              <li><Link href="/board/promotion?category=rent" className="hover:text-white transition-colors">🚗 렌트카</Link></li>
              <li><Link href="/board/promotion?category=exchange" className="hover:text-white transition-colors">💱 환전</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
          <p>© 2024 베트남인포. All rights reserved. | 호치민 한인 커뮤니티</p>
        </div>
      </div>
    </footer>
  );
}
