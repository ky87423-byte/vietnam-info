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
const NEXT_ID_KEY     = "vn_next_id";
const MOCK_OVERRIDES  = "vn_mock_overrides"; // mock 게시글 숨김 오버라이드

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

/** 유저 게시글 필드 업데이트 (type 이동, hidden 토글 등) */
export function updatePost(id: number, changes: Partial<Pick<StoredPost, "type" | "hidden">>): void {
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

  return { count: newCount, liked: newLiked };
}
