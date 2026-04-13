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
}

export interface StoredComment {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
}

/* ── 키 ── */
const POSTS_KEY     = "vn_posts";
const COMMENTS_KEY  = "vn_comments";
const LIKES_KEY     = "vn_post_likes";
const LIKED_KEY     = "vn_liked_posts";
const NEXT_ID_KEY   = "vn_next_id";

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
