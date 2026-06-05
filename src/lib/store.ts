/**
 * API 기반 데이터 스토어 (구 localStorage 스토어 대체)
 * - 게시글/댓글/추천/신고 — 모든 데이터는 서버 DB에 저장됨
 */

import { Category, District, MemberGrade } from "@/lib/mockData";

/* ── 타입 ── */
export interface StoredPost {
  id: number;
  type: "promotion" | "free" | "review";
  title: string;
  content: string;
  author: string;
  authorId?: number | null;
  authorGrade?: MemberGrade;
  category?: Category;
  district?: District;
  rating?: number;
  contacts?: { phone?: string; kakao?: string; telegram?: string; zalo?: string };
  imageUrls?: string[];
  views: number;
  likes: number;
  dislikes: number;
  commentCount: number;
  createdAt: string;
  isPaid?: boolean;
  hidden?: boolean;
  isPinned?: boolean;
  /** 하위 호환 — DB 전환 후 모든 글이 수정/삭제 대상 */
  isUserCreated: true;
}

export interface StoredComment {
  id: number;
  postId: number;
  author: string;
  authorId?: number | null;
  content: string;
  createdAt: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "요청에 실패했습니다.");
  return data as T;
}

function normalizePost(p: Omit<StoredPost, "isUserCreated">): StoredPost {
  return { ...p, isUserCreated: true };
}

/* ══ 게시글 ══ */

/** 게시글 목록 — type 미지정 시 전체. opts.all=true는 관리자용(숨김 포함) */
export async function getPosts(
  type?: StoredPost["type"],
  opts?: { q?: string; author?: string; all?: boolean }
): Promise<StoredPost[]> {
  const params = new URLSearchParams();
  if (type)         params.set("type", type);
  if (opts?.q)      params.set("q", opts.q);
  if (opts?.author) params.set("author", opts.author);
  if (opts?.all)    params.set("all", "1");
  const { posts } = await request<{ posts: Omit<StoredPost, "isUserCreated">[] }>(
    `/api/posts?${params.toString()}`
  );
  return posts.map(normalizePost);
}

/** 게시글 상세 — view=true면 조회수 증가 */
export async function getPost(id: number, view = false): Promise<StoredPost | null> {
  try {
    const { post } = await request<{ post: Omit<StoredPost, "isUserCreated"> }>(
      `/api/posts/${id}${view ? "?view=1" : ""}`
    );
    return normalizePost(post);
  } catch {
    return null;
  }
}

export async function addPost(data: {
  type: StoredPost["type"];
  title: string;
  content: string;
  category?: Category;
  district?: District;
  rating?: number;
  contacts?: StoredPost["contacts"];
  imageUrls?: string[];
}): Promise<StoredPost> {
  const { post } = await request<{ post: Omit<StoredPost, "isUserCreated"> }>("/api/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizePost(post);
}

export async function updatePost(
  id: number,
  changes: Partial<Pick<StoredPost, "type" | "hidden" | "isPinned" | "isPaid" | "title" | "content" | "imageUrls" | "category" | "district" | "rating" | "contacts">>
): Promise<void> {
  await request(`/api/posts/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export async function deletePost(id: number): Promise<void> {
  await request(`/api/posts/${id}`, { method: "DELETE" });
}

/* ══ 댓글 ══ */

export async function getComments(postId: number): Promise<StoredComment[]> {
  const { comments } = await request<{ comments: StoredComment[] }>(`/api/posts/${postId}/comments`);
  return comments;
}

/** 댓글 작성 — 작성자는 서버 세션 기준 (포인트도 서버에서 지급) */
export async function addComment(postId: number, content: string): Promise<StoredComment> {
  const { comment } = await request<{ comment: StoredComment }>(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return comment;
}

export async function deleteComment(commentId: number): Promise<void> {
  await request(`/api/comments/${commentId}`, { method: "DELETE" });
}

/** 전체 댓글 (관리자) */
export async function getAllComments(): Promise<StoredComment[]> {
  const { comments } = await request<{ comments: StoredComment[] }>("/api/admin/comments");
  return comments;
}

/* ══ 공지 고정핀 (관리자) ══ */

export async function setPinned(id: number, isPinned: boolean): Promise<void> {
  await updatePost(id, { isPinned });
}

/* ══ 신고 ══ */

export type ReportTarget = "post" | "comment";
export type ReportReason = "spam" | "abuse" | "illegal" | "adult" | "other";
export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface Report {
  id: number;
  targetType: ReportTarget;
  targetId: number;
  postId?: number;
  reporterName: string;
  reason: ReportReason;
  detail?: string;
  status: ReportStatus;
  createdAt: string;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam:    "스팸/광고",
  abuse:   "욕설/비방",
  illegal: "불법 정보",
  adult:   "음란/성인",
  other:   "기타",
};

export async function addReport(data: {
  targetType: ReportTarget;
  targetId: number;
  postId?: number;
  reason: ReportReason;
  detail?: string;
}): Promise<void> {
  await request("/api/reports", { method: "POST", body: JSON.stringify(data) });
}

export async function getReports(): Promise<Report[]> {
  const { reports } = await request<{ reports: Report[] }>("/api/reports");
  return reports;
}

export async function updateReportStatus(id: number, status: ReportStatus): Promise<void> {
  await request(`/api/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

/* ══ 추천/비추천 ══ */

export interface VoteResult {
  likes: number;
  dislikes: number;
  myVote: -1 | 0 | 1;
}

/** 내 투표 상태 (비로그인 시 0) */
export async function getMyVote(postId: number): Promise<-1 | 0 | 1> {
  try {
    const { myVote } = await request<{ myVote: -1 | 0 | 1 }>(`/api/posts/${postId}/vote`);
    return myVote;
  } catch {
    return 0;
  }
}

/** 추천(1)/비추천(-1) 토글 — 로그인 필요 */
export async function vote(postId: number, value: 1 | -1): Promise<VoteResult> {
  return request<VoteResult>(`/api/posts/${postId}/vote`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}
