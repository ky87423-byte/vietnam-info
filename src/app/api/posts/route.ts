import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/session";
import { serializePost } from "@/lib/serialize";
import { awardPoints, getPointConfig } from "@/lib/points-server";

const POST_TYPES = ["promotion", "free", "review"] as const;
type PostType = (typeof POST_TYPES)[number];

/** 게시글 목록 — ?type=free&q=검색어&author=닉네임&all=1(관리자: 숨김 포함) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type   = searchParams.get("type");
  const q      = searchParams.get("q")?.trim();
  const author = searchParams.get("author")?.trim();
  const all    = searchParams.get("all") === "1";

  let includeHidden = false;
  if (all) {
    const user = await getSessionUser();
    includeHidden = isAdmin(user);
  }

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      ...(type && POST_TYPES.includes(type as PostType) ? { type } : {}),
      ...(includeHidden ? {} : { hidden: false }),
      ...(author ? { authorName: author } : {}),
      ...(q ? {
        OR: [
          { title:   { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: { author: { select: { points: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: 500,
  });

  return Response.json({ posts: posts.map(serializePost) });
}

/** 게시글 작성 (로그인 필수) */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const { type, title, content, category, district, rating, contacts, imageUrls } = body as {
    type?: string; title?: string; content?: string;
    category?: string; district?: string; rating?: number;
    contacts?: { phone?: string; kakao?: string; telegram?: string; zalo?: string };
    imageUrls?: string[];
  };

  if (!type || !POST_TYPES.includes(type as PostType))
    return Response.json({ error: "게시판 종류가 올바르지 않습니다." }, { status: 400 });
  if (!title?.trim())   return Response.json({ error: "제목을 입력해주세요." }, { status: 400 });
  if (!content?.trim()) return Response.json({ error: "내용을 입력해주세요." }, { status: 400 });

  const post = await prisma.post.create({
    data: {
      type,
      title: title.trim(),
      content,
      authorId: user.id,
      authorName: user.name,
      category: category || null,
      district: district || null,
      rating: typeof rating === "number" ? rating : null,
      contactPhone:    contacts?.phone    ?? "",
      contactKakao:    contacts?.kakao    ?? "",
      contactTelegram: contacts?.telegram ?? "",
      contactZalo:     contacts?.zalo     ?? "",
      imageUrls: Array.isArray(imageUrls) ? imageUrls.slice(0, 10) : [],
    },
    include: { author: { select: { points: true } } },
  });

  // 게시글 작성 포인트
  const config = await getPointConfig();
  const balance = await awardPoints(user.id, "post", config.post, `게시글 #${post.id}`);

  return Response.json({ post: serializePost(post), awarded: config.post, balance });
}
