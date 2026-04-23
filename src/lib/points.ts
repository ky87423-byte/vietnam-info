import type { MemberGrade } from "@/lib/mockData";

/* ── 등급별 최소 포인트 ── */
export const GRADE_THRESHOLDS: { grade: MemberGrade; min: number; label: string; color: string }[] = [
  { grade: "VIP",   min: 5000, label: "VIP",   color: "bg-red-100 text-red-700"    },
  { grade: "전문가", min: 1500, label: "전문가", color: "bg-orange-100 text-orange-700" },
  { grade: "우수",   min: 500,  label: "우수",   color: "bg-purple-100 text-purple-700" },
  { grade: "일반",   min: 100,  label: "일반",   color: "bg-blue-100 text-blue-700"  },
  { grade: "새싹",   min: 0,    label: "새싹",   color: "bg-green-100 text-green-700" },
];

/* ── 포인트 지급 기본값 ── */
export const DEFAULT_POINT_REWARDS = {
  post:    10,  // 게시글 작성
  comment:  5,  // 댓글 작성
  login:    5,  // 1일 1회 로그인
};

export type PointRewards = typeof DEFAULT_POINT_REWARDS;

const POINT_SETTINGS_KEY = "vn_point_settings";

/** 현재 포인트 설정 (관리자가 조정한 값 또는 기본값) */
export function getPointRewards(): PointRewards {
  if (typeof window === "undefined") return { ...DEFAULT_POINT_REWARDS };
  try {
    const raw = localStorage.getItem(POINT_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_POINT_REWARDS };
    const saved = JSON.parse(raw) as Partial<PointRewards>;
    return {
      post:    saved.post    ?? DEFAULT_POINT_REWARDS.post,
      comment: saved.comment ?? DEFAULT_POINT_REWARDS.comment,
      login:   saved.login   ?? DEFAULT_POINT_REWARDS.login,
    };
  } catch {
    return { ...DEFAULT_POINT_REWARDS };
  }
}

/** 포인트 설정 저장 (관리자용) */
export function savePointRewards(rewards: PointRewards): void {
  localStorage.setItem(POINT_SETTINGS_KEY, JSON.stringify(rewards));
}

/** 하위 호환용 — 기존 코드에서 POINT_REWARDS.post 등으로 접근하는 곳 대응 */
export const POINT_REWARDS = DEFAULT_POINT_REWARDS;

/* ── 포인트 → 등급 계산 ── */
export function gradeFromPoints(points: number): MemberGrade {
  for (const { grade, min } of GRADE_THRESHOLDS) {
    if (points >= min) return grade;
  }
  return "새싹";
}

/* ── 다음 등급까지 필요 포인트 ── */
export function nextGradeInfo(points: number): { nextGrade: MemberGrade | null; needed: number; progress: number } {
  const current = GRADE_THRESHOLDS.findIndex(({ min }) => points >= min);
  if (current <= 0) return { nextGrade: null, needed: 0, progress: 100 }; // VIP
  const next   = GRADE_THRESHOLDS[current - 1];
  const cur    = GRADE_THRESHOLDS[current];
  const needed = next.min - points;
  const progress = Math.round(((points - cur.min) / (next.min - cur.min)) * 100);
  return { nextGrade: next.grade, needed, progress };
}
