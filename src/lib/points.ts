import type { MemberGrade } from "@/lib/mockData";

/* ── 등급별 최소 포인트 ── */
export const GRADE_THRESHOLDS: { grade: MemberGrade; min: number; label: string; color: string }[] = [
  { grade: "VIP",   min: 5000, label: "VIP",   color: "bg-red-100 text-red-700"    },
  { grade: "전문가", min: 1500, label: "전문가", color: "bg-orange-100 text-orange-700" },
  { grade: "우수",   min: 500,  label: "우수",   color: "bg-purple-100 text-purple-700" },
  { grade: "일반",   min: 100,  label: "일반",   color: "bg-blue-100 text-blue-700"  },
  { grade: "새싹",   min: 0,    label: "새싹",   color: "bg-green-100 text-green-700" },
];

/* ── 포인트 지급 설정 ── */
export const POINT_REWARDS = {
  post:    10,  // 게시글 작성
  comment:  5,  // 댓글 작성
} as const;

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
