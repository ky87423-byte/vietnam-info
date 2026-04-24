export type MemberGrade = "새싹" | "일반" | "우수" | "전문가" | "VIP";

export interface NearbyPlace {
  id: number;
  name: string;
  category: Category;
  district: District;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
}

export const nearbyPlaces: NearbyPlace[] = [
  // 음식점
  { id: 1,  name: "미스사이공 한식당",    category: "food",     district: "1군", lat: 10.7757, lng: 106.7004, address: "Bến Nghé, Quận 1",        phone: "+84 28 1234 5678" },
  { id: 2,  name: "한강 식당",            category: "food",     district: "2군", lat: 10.7972, lng: 106.7456, address: "Thảo Điền, Quận 2",       phone: "+84 28 2345 6789" },
  { id: 3,  name: "서울 갈비",            category: "food",     district: "7군", lat: 10.7325, lng: 106.7208, address: "Tân Phú, Quận 7",         phone: "+84 28 3456 7890" },
  { id: 4,  name: "고향 순두부",          category: "food",     district: "3군", lat: 10.7810, lng: 106.6880, address: "Võ Thị Sáu, Quận 3",      phone: "+84 90 1111 2222" },
  { id: 5,  name: "부산 해물탕",          category: "food",     district: "5군", lat: 10.7550, lng: 106.6750, address: "Nguyễn Trãi, Quận 5",     phone: "+84 90 3333 4444" },
  // 골프
  { id: 6,  name: "사이공 골프클럽",      category: "golf",     district: "7군", lat: 10.7200, lng: 106.7100, address: "Phú Mỹ Hưng, Quận 7",    phone: "+84 28 9876 5432" },
  { id: 7,  name: "롱탄 골프 예약센터",   category: "golf",     district: "2군", lat: 10.8100, lng: 106.7600, address: "An Phú, Quận 2",          phone: "+84 90 5555 6666" },
  { id: 8,  name: "베트남 골프투어",      category: "golf",     district: "1군", lat: 10.7760, lng: 106.7030, address: "Lê Lợi, Quận 1",          phone: "+84 90 7777 8888" },
  // 숙소
  { id: 9,  name: "빈컴 레지던스",        category: "hotel",    district: "2군", lat: 10.8050, lng: 106.7480, address: "Thảo Điền, Quận 2",       phone: "+84 28 5555 1234" },
  { id: 10, name: "사이공 인 호텔",       category: "hotel",    district: "1군", lat: 10.7780, lng: 106.6990, address: "Phạm Ngũ Lão, Quận 1",   phone: "+84 28 6666 7777" },
  { id: 11, name: "타오디엔 아파트",      category: "hotel",    district: "2군", lat: 10.8020, lng: 106.7510, address: "Thảo Điền, Quận 2",       phone: "+84 90 8888 9999" },
  { id: 12, name: "퓨 미 흥 레지던스",    category: "hotel",    district: "7군", lat: 10.7270, lng: 106.7180, address: "Phú Mỹ Hưng, Quận 7",    phone: "+84 28 7777 1111" },
  // 렌트카
  { id: 13, name: "드림렌트카",           category: "rent",     district: "3군", lat: 10.7765, lng: 106.6855, address: "Lý Thường Kiệt, Quận 3", phone: "+84 90 8765 4321" },
  { id: 14, name: "사이공 카렌트",        category: "rent",     district: "1군", lat: 10.7740, lng: 106.7020, address: "Nam Kỳ Khởi Nghĩa, Quận 1", phone: "+84 90 2222 3333" },
  { id: 15, name: "VN 렌터카",           category: "rent",     district: "7군", lat: 10.7310, lng: 106.7190, address: "Nguyễn Văn Linh, Quận 7", phone: "+84 90 4444 5555" },
  // 마사지
  { id: 16, name: "사이공 힐링마사지",    category: "massage",  district: "1군", lat: 10.7780, lng: 106.7020, address: "Hàm Nghi, Quận 1",        phone: "+84 28 1111 2222" },
  { id: 17, name: "타오디엔 스파",        category: "massage",  district: "2군", lat: 10.8000, lng: 106.7450, address: "An Phú, Quận 2",          phone: "+84 28 3333 4444" },
  { id: 18, name: "퓨미흥 웰니스",        category: "massage",  district: "7군", lat: 10.7290, lng: 106.7200, address: "Phú Mỹ Hưng, Quận 7",    phone: "+84 28 5555 6666" },
  // 기타
  { id: 19, name: "호치민 한인마트",      category: "etc",      district: "7군", lat: 10.7330, lng: 106.7220, address: "Nguyễn Đức Cảnh, Quận 7", phone: "+84 28 3344 5566" },
  { id: 20, name: "한국 약국",            category: "etc",      district: "1군", lat: 10.7760, lng: 106.7010, address: "Đồng Khởi, Quận 1",       phone: "+84 90 6666 7777" },
  { id: 21, name: "사이공 한국학교",      category: "etc",      district: "2군", lat: 10.8090, lng: 106.7420, address: "Thảo Điền, Quận 2",       phone: "+84 28 9999 0000" },
];

export const markerColors: Record<Category, string> = {
  food:     "#EF4444",
  golf:     "#22C55E",
  hotel:    "#3B82F6",
  rent:     "#A855F7",
  massage: "#F59E0B",
  etc:      "#6B7280",
};
export type MemberType = "general" | "business" | "admin";
export type Category = "food" | "golf" | "hotel" | "rent" | "massage" | "etc";
export type District = "1군" | "2군" | "3군" | "4군" | "5군" | "6군" | "7군" | "8군" | "9군" | "기타";
export const ALL_DISTRICTS: District[] = ["1군","2군","3군","4군","5군","6군","7군","8군","9군","기타"];

export interface ContactInfo {
  phone?: string;
  kakao?: string;
  telegram?: string;
  zalo?: string;
}

export interface Post {
  id: number;
  type: "promotion" | "free" | "review";
  title: string;
  content: string;
  author: string;
  authorGrade?: MemberGrade;
  category?: Category;
  district?: District;
  views: number;
  likes: number;
  commentCount: number;
  createdAt: string;
  imageUrl?: string;
  isPaid?: boolean;
  rating?: number;
  contacts?: ContactInfo;
}

export interface AdBusiness {
  id: number;
  name: string;
  category: Category;
  district: District;
  imageUrl: string;
  description: string;
  phone: string;
  href: string;
}

export const categoryLabels: Record<Category, string> = {
  food: "음식점",
  golf: "골프",
  hotel: "숙소",
  rent: "렌트카",
  massage: "마사지",
  etc: "기타",
};

export const categoryIcons: Record<Category, string> = {
  food: "🍜",
  golf: "⛳",
  hotel: "🏨",
  rent: "🚗",
  massage: "💆",
  etc: "📦",
};

export const gradeColors: Record<MemberGrade, string> = {
  "새싹": "bg-green-100 text-green-700",
  "일반": "bg-blue-100 text-blue-700",
  "우수": "bg-purple-100 text-purple-700",
  "전문가": "bg-orange-100 text-orange-700",
  "VIP": "bg-red-100 text-red-700",
};

// 유료광고 업체 (메인 상단 노출)
export const paidAds: AdBusiness[] = [
  {
    id: 1,
    name: "미스사이공 한식당",
    category: "food",
    district: "1군",
    imageUrl: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=250&fit=crop",
    description: "호치민 1군 중심가의 정통 한식당. 된장찌개, 불고기, 비빔밥 전문",
    phone: "+84 28 1234 5678",
    href: "/board/promotion/1",
  },
  {
    id: 2,
    name: "사이공 골프클럽",
    category: "golf",
    district: "7군",
    imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop",
    description: "호치민 최고의 골프 투어 전문업체. 베트남 전역 골프장 예약 대행",
    phone: "+84 28 9876 5432",
    href: "/board/promotion/2",
  },
  {
    id: 3,
    name: "빈컴 레지던스",
    category: "hotel",
    district: "2군",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop",
    description: "2군 타오디엔 프리미엄 서비스 레지던스. 한국인 관리 서비스",
    phone: "+84 28 5555 1234",
    href: "/board/promotion/3",
  },
];

// 홍보게시판 게시글
export const promotionPosts: Post[] = [
  {
    id: 1,
    type: "promotion",
    title: "미스사이공 한식당 - 호치민 1군 정통 한식",
    content: "된장찌개, 불고기, 비빔밥 전문 한식당입니다. 점심 특선 메뉴 운영 중!",
    author: "미스사이공",
    category: "food",
    district: "1군",
    views: 1250,
    likes: 45,
    commentCount: 12,
    createdAt: "2024-03-10",
    imageUrl: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=300&h=200&fit=crop",
    isPaid: true,
    contacts: {
      phone: "+84 28 1234 5678",
      kakao: "missaigon_kr",
      telegram: "@missaigon_hcm",
      zalo: "+84 90 1234 5678",
    },
  },
  {
    id: 2,
    type: "promotion",
    title: "사이공 골프클럽 - 베트남 골프투어 전문",
    content: "베트남 전역 골프장 라운딩 예약, 카트 포함 최저가 보장!",
    author: "사이공골프",
    category: "golf",
    district: "7군",
    views: 980,
    likes: 33,
    commentCount: 8,
    createdAt: "2024-03-09",
    imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=200&fit=crop",
    isPaid: true,
    contacts: {
      phone: "+84 28 9876 5432",
      kakao: "saigongolf_vn",
      telegram: "@saigongolf",
    },
  },
  {
    id: 3,
    type: "promotion",
    title: "빈컴 레지던스 - 2군 프리미엄 숙소",
    content: "타오디엔 중심 위치, 수영장, 헬스장, 한국어 서비스 제공",
    author: "빈컴레지던스",
    category: "hotel",
    district: "2군",
    views: 756,
    likes: 28,
    commentCount: 5,
    createdAt: "2024-03-08",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop",
    isPaid: true,
    contacts: {
      phone: "+84 28 5555 1234",
    },
  },
  {
    id: 4,
    type: "promotion",
    title: "드림렌트카 - 호치민 렌트카 전문",
    content: "오토바이, 승용차, 미니버스 렌트 전문. 기사 포함 가능",
    author: "드림렌트카",
    category: "rent",
    district: "3군",
    views: 632,
    likes: 19,
    commentCount: 7,
    createdAt: "2024-03-07",
    isPaid: true,
    imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e04b?w=300&h=200&fit=crop",
    contacts: {
      phone: "+84 90 8765 4321",
      kakao: "dreamrent_hcm",
      zalo: "+84 90 8765 4321",
    },
  },
  {
    id: 5,
    type: "promotion",
    title: "사이공 힐링마사지 - 전통 타이·스웨디시",
    content: "1군 중심가 위치. 타이마사지·스웨디시·발마사지 전문. 한국어 예약 가능",
    author: "사이공힐링",
    category: "massage",
    district: "1군",
    views: 541,
    likes: 22,
    commentCount: 3,
    createdAt: "2024-03-06",
    isPaid: true,
    imageUrl: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=300&h=200&fit=crop",
    contacts: {
      kakao: "saigon_healing",
      telegram: "@saigon_massage",
    },
  },
  {
    id: 6,
    type: "promotion",
    title: "호치민 한인마트 - 한국 식품 전문점",
    content: "라면, 과자, 김치, 신선식품 등 한국 식품 다수 취급",
    author: "한인마트",
    category: "etc",
    district: "7군",
    views: 489,
    likes: 15,
    commentCount: 9,
    createdAt: "2024-03-05",
    isPaid: true,
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop",
    contacts: {
      phone: "+84 28 3344 5566",
      kakao: "hcm_koreanmart",
      telegram: "@koreanmart_hcm",
      zalo: "+84 28 3344 5566",
    },
  },
  // 일반 게시글
  {
    id: 7,
    type: "promotion",
    title: "한강 식당 - 2군 한식 전문",
    content: "타오디엔 거주 한인들의 단골 한식당. 점심·저녁 운영",
    author: "한강식당",
    category: "food",
    district: "2군",
    views: 430,
    likes: 18,
    commentCount: 4,
    createdAt: "2024-03-04",
    isPaid: false,
    contacts: { phone: "+84 28 2345 6789" },
  },
  {
    id: 8,
    type: "promotion",
    title: "롱탄 골프 예약센터 - 당일 예약 가능",
    content: "롱탄 골프장 전문 예약대행. 셔틀버스 운행",
    author: "롱탄골프",
    category: "golf",
    district: "2군",
    views: 380,
    likes: 14,
    commentCount: 3,
    createdAt: "2024-03-03",
    isPaid: false,
    contacts: { phone: "+84 90 5555 6666", kakao: "longthan_golf" },
  },
  {
    id: 9,
    type: "promotion",
    title: "퓨 미 흥 레지던스 - 7군 장기 숙소",
    content: "월 단위 렌트 가능. 풀옵션 아파트, 한국어 관리",
    author: "PMH레지던스",
    category: "hotel",
    district: "7군",
    views: 310,
    likes: 11,
    commentCount: 2,
    createdAt: "2024-03-02",
    isPaid: false,
    contacts: { phone: "+84 28 7777 1111" },
  },
  {
    id: 10,
    type: "promotion",
    title: "VN 렌터카 - 기사 포함 장거리 OK",
    content: "다낭·나트랑 장거리 기사 포함 렌트 전문",
    author: "VN렌터카",
    category: "rent",
    district: "7군",
    views: 270,
    likes: 9,
    commentCount: 1,
    createdAt: "2024-03-01",
    isPaid: false,
    contacts: { phone: "+84 90 4444 5555", zalo: "+84 90 4444 5555" },
  },
  {
    id: 11,
    type: "promotion",
    title: "타오디엔 스파 - 2군 프리미엄 마사지",
    content: "타오디엔 거주 한인 단골 스파. 아로마·딥티슈·커플 마사지. 사전 예약 필수",
    author: "타오디엔스파",
    category: "massage",
    district: "2군",
    views: 220,
    likes: 8,
    commentCount: 2,
    createdAt: "2024-02-28",
    isPaid: false,
    contacts: { phone: "+84 28 3333 4444" },
  },
  {
    id: 12,
    type: "promotion",
    title: "한국 약국 - 1군 한국 의약품 취급",
    content: "한국 직수입 의약품·건강식품 전문. 한국어 상담 가능",
    author: "한국약국",
    category: "etc",
    district: "1군",
    views: 195,
    likes: 7,
    commentCount: 3,
    createdAt: "2024-02-27",
    isPaid: false,
    contacts: { phone: "+84 90 6666 7777", kakao: "kr_pharmacy_hcm" },
  },
];

// 자유게시판 게시글
export const freePosts: Post[] = [
  {
    id: 101,
    type: "free",
    title: "호치민 생활 3년차 꿀팁 총정리",
    content: "제가 3년간 살면서 얻은 꿀팁들을 공유합니다...",
    author: "사이공생활자",
    authorGrade: "전문가",
    views: 2341,
    likes: 156,
    commentCount: 45,
    createdAt: "2024-03-11",
  },
  {
    id: 102,
    type: "free",
    title: "그랩(Grab) 이용 시 주의사항",
    content: "그랩 이용할 때 알아두면 좋은 점들...",
    author: "호치민여행자",
    authorGrade: "우수",
    views: 1823,
    likes: 98,
    commentCount: 23,
    createdAt: "2024-03-10",
  },
  {
    id: 103,
    type: "free",
    title: "베트남 비자 연장 후기 (2024년 최신)",
    content: "비자 연장 직접 해봤습니다. 절차 공유드려요...",
    author: "비자고수",
    authorGrade: "VIP",
    views: 3102,
    likes: 201,
    commentCount: 67,
    createdAt: "2024-03-09",
  },
  {
    id: 104,
    type: "free",
    title: "호치민 한국어 학원 추천",
    content: "아이 한국어 교육 때문에 학원 알아보시는 분들께...",
    author: "학부모",
    authorGrade: "일반",
    views: 987,
    likes: 54,
    commentCount: 18,
    createdAt: "2024-03-08",
  },
];

// 후기게시판 게시글
export const reviewPosts: Post[] = [
  {
    id: 201,
    type: "review",
    title: "미스사이공 한식당 솔직후기 ★★★★★",
    content: "된장찌개가 정말 한국 맛이에요. 사장님도 친절하시고...",
    author: "맛집탐방",
    authorGrade: "우수",
    category: "food",
    district: "1군",
    views: 1432,
    likes: 87,
    commentCount: 21,
    createdAt: "2024-03-11",
    rating: 5,
  },
  {
    id: 202,
    type: "review",
    title: "사이공 골프클럽 이용 후기",
    content: "저번 주 라운딩 다녀왔는데 서비스가 정말 좋았어요...",
    author: "골프매니아",
    authorGrade: "전문가",
    category: "golf",
    district: "7군",
    views: 876,
    likes: 43,
    commentCount: 12,
    createdAt: "2024-03-10",
    rating: 4,
  },
  {
    id: 203,
    type: "review",
    title: "드림렌트카 - 다낭 여행 렌트 후기",
    content: "차량 상태도 좋고 기사님이 친절하셨어요...",
    author: "여행왕",
    authorGrade: "일반",
    category: "rent",
    district: "3군",
    views: 654,
    likes: 31,
    commentCount: 9,
    createdAt: "2024-03-09",
    rating: 4,
  },
  {
    id: 204,
    type: "review",
    title: "사이공 힐링마사지 - 타이마사지 최고예요",
    content: "1군에서 이렇게 실력 좋은 마사지샵은 처음이에요. 가격도 합리적이고 한국어 소통도 돼서 너무 편했습니다.",
    author: "마사지러버",
    authorGrade: "새싹",
    category: "massage",
    district: "1군",
    views: 432,
    likes: 25,
    commentCount: 6,
    createdAt: "2024-03-08",
    rating: 5,
  },
  {
    id: 205,
    type: "review",
    title: "[테스트] 빈컴 레지던스 2군 장기 투숙 후기",
    content: "2군 타오디엔 빈컴 레지던스에서 한 달 지내봤습니다. 수영장, 헬스장 시설이 깔끔하고 한국어 지원이 돼서 불편함이 없었어요. 위치도 좋고 주변에 한식당이 많아서 생활하기 편했습니다. 장기 투숙 계획이신 분들께 적극 추천합니다!",
    author: "테스트계정",
    authorGrade: "일반",
    category: "hotel",
    district: "2군",
    views: 1,
    likes: 0,
    commentCount: 0,
    createdAt: "2026-04-24",
    rating: 4,
  },
];
