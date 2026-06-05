/**
 * 초기 시드 — 계정 + 사이트 설정 + mock 게시글 이관
 * 실행: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { promotionPosts, freePosts, reviewPosts, Post as MockPost } from "../src/lib/mockData";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function seedUsers() {
  const accounts = [
    { email: "asdf1a",            password: "asdf1a", name: "관리자",   memberType: "admin",    points: 9999 },
    { email: "business@test.com", password: "1234",   name: "업소회원", memberType: "business", businessName: "테스트업소", points: 500 },
    { email: "user@test.com",     password: "1234",   name: "일반회원", memberType: "general",  points: 100 },
  ];
  for (const a of accounts) {
    const passwordHash = await bcrypt.hash(a.password, 10);
    await prisma.user.upsert({
      where:  { email: a.email },
      update: {},
      create: {
        email: a.email,
        name: a.name,
        passwordHash,
        memberType: a.memberType,
        businessName: "businessName" in a ? a.businessName : undefined,
        points: a.points,
      },
    });
  }
  console.log(`✔ 계정 ${accounts.length}건 시드 완료`);
}

async function seedSiteConfig() {
  await prisma.siteConfig.upsert({
    where:  { id: 1 },
    update: {},
    create: { id: 1 },
  });
  console.log("✔ SiteConfig 시드 완료");
}

function toRow(p: MockPost) {
  return {
    id:              p.id,
    type:            p.type,
    title:           p.title,
    content:         p.content,
    authorName:      p.author,
    category:        p.category ?? null,
    district:        p.district ?? null,
    rating:          p.rating ?? null,
    contactPhone:    p.contacts?.phone ?? "",
    contactKakao:    p.contacts?.kakao ?? "",
    contactTelegram: p.contacts?.telegram ?? "",
    contactZalo:     p.contacts?.zalo ?? "",
    imageUrls:       p.imageUrl ? [p.imageUrl] : [],
    views:           p.views,
    likeCount:       p.likes,
    commentCount:    0,            // 댓글은 DB 기준으로 새로 시작
    isPaid:          p.isPaid ?? false,
    createdAt:       new Date(p.createdAt),
  };
}

async function seedPosts() {
  const all = [...promotionPosts, ...freePosts, ...reviewPosts];
  const result = await prisma.post.createMany({
    data: all.map(toRow),
    skipDuplicates: true,          // 재실행 시 기존 id 건너뜀
  });
  // 명시적 id 삽입 후 시퀀스 보정
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Post"','id'), (SELECT COALESCE(MAX(id),1) FROM "Post"))`
  );
  console.log(`✔ mock 게시글 ${result.count}건 이관 완료 (전체 ${all.length}건)`);
}

async function main() {
  await seedUsers();
  await seedSiteConfig();
  await seedPosts();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
