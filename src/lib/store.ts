/**
 * localStorage 기반 데이터 스토어
 * - 게시글(posts), 댓글(comments), 좋아요(likes) 관리
 */

import { Post, Category, District } from "@/lib/mockData";

/* ── 타입 ── */
export interface StoredPost extends Omit<Post, "authorGrade" | "imageUrl"> {
  isUserCreated: true;
  contacts?: { phone?: string; kakao?: string; telegram?: string; zalo?: string };
  imageUrls?: string[];
  hidden?: boolean;
}

/* mock 게시글 숨김 오버라이드 타입 */
export type MockOverride = { hidden?: boolean };

export interface StoredComment {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
}

/* ── 키 ── */
const POSTS_KEY       = "vn_posts";
const COMMENTS_KEY    = "vn_comments";
const LIKES_KEY       = "vn_post_likes";
const LIKED_KEY       = "vn_liked_posts";
const DISLIKES_KEY    = "vn_post_dislikes";
const DISLIKED_KEY    = "vn_disliked_posts";
const NEXT_ID_KEY     = "vn_next_id";
const MOCK_OVERRIDES  = "vn_mock_overrides";
const PINNED_KEY      = "vn_pinned_posts";
const REPORTS_KEY     = "vn_reports";

/* ── ID 생성 ── */
function nextId(): number {
  const cur = Number(localStorage.getItem(NEXT_ID_KEY) ?? "10000");
  localStorage.setItem(NEXT_ID_KEY, String(cur + 1));
  return cur;
}

function parse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/* ══ 게시글 ══ */

export function getUserPosts(type?: StoredPost["type"]): StoredPost[] {
  const all = parse<StoredPost[]>(POSTS_KEY, []);
  return type ? all.filter((p) => p.type === type) : all;
}

export function addPost(data: {
  type: StoredPost["type"];
  title: string;
  content: string;
  author: string;
  category?: Category;
  district?: District;
  rating?: number;
  contacts?: StoredPost["contacts"];
  imageUrls?: string[];
}): StoredPost {
  const post: StoredPost = {
    ...data,
    id: nextId(),
    views: 0,
    likes: 0,
    commentCount: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    isPaid: false,
    isUserCreated: true,
  };
  const all = parse<StoredPost[]>(POSTS_KEY, []);
  localStorage.setItem(POSTS_KEY, JSON.stringify([post, ...all]));
  return post;
}

export function deletePost(id: number): void {
  const all = parse<StoredPost[]>(POSTS_KEY, []);
  localStorage.setItem(POSTS_KEY, JSON.stringify(all.filter((p) => p.id !== id)));
}

/** 유저 게시글 필드 업데이트 (type 이동, hidden 토글, 내용 수정 등) */
export function updatePost(
  id: number,
  changes: Partial<Pick<StoredPost, "type" | "hidden" | "title" | "content" | "imageUrls" | "category" | "district" | "rating" | "contacts">>
): void {
  const all = parse<StoredPost[]>(POSTS_KEY, []);
  const idx = all.findIndex((p) => p.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...changes };
    localStorage.setItem(POSTS_KEY, JSON.stringify(all));
  }
}

/* ── Mock 게시글 오버라이드 ── */

export function getMockOverrides(): Record<number, MockOverride> {
  return parse<Record<number, MockOverride>>(MOCK_OVERRIDES, {});
}

export function setMockHidden(id: number, hidden: boolean): void {
  const all = getMockOverrides();
  all[id] = { ...all[id], hidden };
  localStorage.setItem(MOCK_OVERRIDES, JSON.stringify(all));
}

export function isMockHidden(id: number): boolean {
  const all = getMockOverrides();
  return all[id]?.hidden ?? false;
}

/* ══ 댓글 ══ */

export function getComments(postId: number): StoredComment[] {
  const all = parse<Record<number, StoredComment[]>>(COMMENTS_KEY, {});
  return all[postId] ?? [];
}

export function addComment(postId: number, author: string, content: string): StoredComment {
  const comment: StoredComment = {
    id: Date.now(),
    postId,
    author,
    content,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const all = parse<Record<number, StoredComment[]>>(COMMENTS_KEY, {});
  all[postId] = [comment, ...(all[postId] ?? [])];
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));

  // commentCount 증가 (user posts만)
  const posts = parse<StoredPost[]>(POSTS_KEY, []);
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx !== -1) {
    posts[idx].commentCount += 1;
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }
  return comment;
}

export function deleteComment(postId: number, commentId: number): void {
  const all = parse<Record<number, StoredComment[]>>(COMMENTS_KEY, {});
  if (all[postId]) {
    all[postId] = all[postId].filter((c) => c.id !== commentId);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  }
  // commentCount 감소
  const posts = parse<StoredPost[]>(POSTS_KEY, []);
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx !== -1 && posts[idx].commentCount > 0) {
    posts[idx].commentCount -= 1;
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }
}

export function getAllComments(): Array<StoredComment & { postId: number }> {
  const all = parse<Record<number, StoredComment[]>>(COMMENTS_KEY, {});
  return Object.values(all).flat() as Array<StoredComment & { postId: number }>;
}

/* ══ 공지 고정핀 ══ */

export type PinnedPosts = { free: number[]; review: number[]; promotion: number[] };

export function getPinnedPosts(): PinnedPosts {
  return parse<PinnedPosts>(PINNED_KEY, { free: [], review: [], promotion: [] });
}

export function togglePinPost(id: number, type: "free" | "review" | "promotion"): boolean {
  const pinned = getPinnedPosts();
  const list   = pinned[type];
  const isPinned = list.includes(id);
  pinned[type] = isPinned ? list.filter((x) => x !== id) : [id, ...list];
  localStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
  return !isPinned;
}

/* ══ 신고 기능 ══ */

export type ReportTarget = "post" | "comment";
export type ReportReason = "spam" | "abuse" | "illegal" | "adult" | "other";
export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface Report {
  id: number;
  targetType: ReportTarget;
  targetId: number;
  postId?: number;       // comment 신고 시 해당 게시글 ID
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

export function addReport(data: Omit<Report, "id" | "status" | "createdAt">): Report {
  const all = parse<Report[]>(REPORTS_KEY, []);
  const report: Report = {
    ...data,
    id:        Date.now(),
    status:    "pending",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  localStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...all]));
  return report;
}

export function getReports(): Report[] {
  return parse<Report[]>(REPORTS_KEY, []);
}

export function updateReportStatus(id: number, status: ReportStatus): void {
  const all = parse<Report[]>(REPORTS_KEY, []);
  const idx = all.findIndex((r) => r.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], status };
    localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  }
}

/* ══ 좋아요 ══ */

export function getLikeState(postId: number, baseLikes: number): { count: number; liked: boolean } {
  const likes = parse<Record<number, number>>(LIKES_KEY, {});
  const likedSet = parse<number[]>(LIKED_KEY, []);
  const count = likes[postId] ?? baseLikes;
  const liked = likedSet.includes(postId);
  return { count, liked };
}

export function toggleLike(postId: number, baseLikes: number): { count: number; liked: boolean } {
  const likes = parse<Record<number, number>>(LIKES_KEY, {});
  const likedArr = parse<number[]>(LIKED_KEY, []);

  const cur = likes[postId] ?? baseLikes;
  const wasLiked = likedArr.includes(postId);

  const newCount = wasLiked ? cur - 1 : cur + 1;
  const newLiked = !wasLiked;

  likes[postId] = newCount;
  const newArr = wasLiked ? likedArr.filter((id) => id !== postId) : [...likedArr, postId];

  localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  localStorage.setItem(LIKED_KEY, JSON.stringify(newArr));

  // 추천 클릭 시 비추천 자동 취소
  if (!wasLiked) {
    const dislikes = parse<Record<number, number>>(DISLIKES_KEY, {});
    const dislikedArr = parse<number[]>(DISLIKED_KEY, []);
    if (dislikedArr.includes(postId)) {
      dislikes[postId] = Math.max(0, (dislikes[postId] ?? 0) - 1);
      localStorage.setItem(DISLIKES_KEY, JSON.stringify(dislikes));
      localStorage.setItem(DISLIKED_KEY, JSON.stringify(dislikedArr.filter(id => id !== postId)));
    }
  }

  return { count: newCount, liked: newLiked };
}

/* ══ 비추천 ══ */

export function getDislikeState(postId: number): { count: number; disliked: boolean } {
  const dislikes = parse<Record<number, number>>(DISLIKES_KEY, {});
  const dislikedSet = parse<number[]>(DISLIKED_KEY, []);
  return { count: dislikes[postId] ?? 0, disliked: dislikedSet.includes(postId) };
}

export function toggleDislike(postId: number, baseLikes: number): { dislikeCount: number; disliked: boolean; likeCount: number; liked: boolean } {
  const dislikes = parse<Record<number, number>>(DISLIKES_KEY, {});
  const dislikedArr = parse<number[]>(DISLIKED_KEY, []);

  const cur = dislikes[postId] ?? 0;
  const wasDisliked = dislikedArr.includes(postId);

  const newDislikeCount = wasDisliked ? cur - 1 : cur + 1;
  dislikes[postId] = newDislikeCount;
  const newDislikedArr = wasDisliked
    ? dislikedArr.filter(id => id !== postId)
    : [...dislikedArr, postId];

  localStorage.setItem(DISLIKES_KEY, JSON.stringify(dislikes));
  localStorage.setItem(DISLIKED_KEY, JSON.stringify(newDislikedArr));

  // 비추천 클릭 시 추천 자동 취소
  let likeCount = getLikeState(postId, baseLikes).count;
  let liked = false;
  if (!wasDisliked) {
    const likes = parse<Record<number, number>>(LIKES_KEY, {});
    const likedArr = parse<number[]>(LIKED_KEY, []);
    if (likedArr.includes(postId)) {
      likeCount = Math.max(0, (likes[postId] ?? baseLikes) - 1);
      likes[postId] = likeCount;
      localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
      localStorage.setItem(LIKED_KEY, JSON.stringify(likedArr.filter(id => id !== postId)));
    } else {
      likeCount = getLikeState(postId, baseLikes).count;
    }
  } else {
    const state = getLikeState(postId, baseLikes);
    likeCount = state.count;
    liked = state.liked;
  }

  return { dislikeCount: newDislikeCount, disliked: !wasDisliked, likeCount, liked };
}
