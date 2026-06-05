/**
 * DB 모델 → 프론트 JSON 직렬화 (서버 전용)
 */
import { gradeFromPoints } from "@/lib/points";
import type { User, Post, Comment } from "@/generated/prisma/client";

export function serializeUser(u: User) {
  return {
    id:           u.id,
    email:        u.email,
    name:         u.name,
    memberType:   u.memberType,
    businessName: u.businessName ?? undefined,
    points:       u.points,
    grade:        gradeFromPoints(u.points),
    status:       u.status,
    createdAt:    u.createdAt.toISOString().slice(0, 10),
  };
}

export type PostWithAuthor = Post & { author: { points: number } | null };

export function serializePost(p: PostWithAuthor) {
  return {
    id:           p.id,
    type:         p.type,
    title:        p.title,
    content:      p.content,
    author:       p.authorName,
    authorId:     p.authorId,
    authorGrade:  p.author ? gradeFromPoints(p.author.points) : undefined,
    category:     p.category ?? undefined,
    district:     p.district ?? undefined,
    rating:       p.rating ?? undefined,
    contacts: {
      phone:    p.contactPhone    || undefined,
      kakao:    p.contactKakao    || undefined,
      telegram: p.contactTelegram || undefined,
      zalo:     p.contactZalo     || undefined,
    },
    imageUrls:    p.imageUrls,
    views:        p.views,
    likes:        p.likeCount,
    dislikes:     p.dislikeCount,
    commentCount: p.commentCount,
    hidden:       p.hidden,
    isPinned:     p.isPinned,
    isPaid:       p.isPaid,
    createdAt:    p.createdAt.toISOString().slice(0, 10),
  };
}

export type SerializedPost = ReturnType<typeof serializePost>;

export function serializeComment(c: Comment) {
  return {
    id:        c.id,
    postId:    c.postId,
    author:    c.authorName,
    authorId:  c.authorId,
    content:   c.content,
    createdAt: c.createdAt.toISOString().slice(0, 10),
  };
}
