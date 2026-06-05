@AGENTS.md

# 베트남인포 (vietnam-info)

호치민 한인 커뮤니티 정보 플랫폼 — 맛집·골프·숙소·렌트카·마사지 업소 홍보 + 자유/후기 게시판.

- 배포: https://vietnam-info.vercel.app (Vercel)
- 저장소: https://github.com/ky87423-byte/vietnam-info
- 현황·이력: `MEMORY.md`, `docs/worklog.md` 참고

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 + TypeScript |
| 스타일 | Tailwind CSS 4 |
| DB | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`, 생성 클라이언트는 `src/generated/prisma` — gitignore됨) |
| 인증 | 자체 세션(bcrypt + HMAC 서명 httpOnly 쿠키 `vn_session`) + NextAuth v5(Google/Kakao OAuth, `src/lib/auth.ts`) |
| 이미지/동영상 | Cloudinary unsigned upload (클라이언트 직접 업로드, `src/lib/cloudinary.ts`) |
| 지도 | Google Maps (`/nearby` 페이지) |
| 메일 | nodemailer (비밀번호 재설정 인증코드, SMTP 미설정 시 콘솔 출력 dev 모드) |

## 명령어

```bash
npm run dev          # 개발 서버 (포트 3000 — 다른 프로젝트와 충돌 시 -p 옵션)
npm run build        # 프로덕션 빌드
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:seed      # 시드 (계정 3개 + mock 게시글 21건, 재실행 안전)
```

## 환경변수 (.env — gitignore됨)

- `DATABASE_URL` — PostgreSQL 연결 (로컬: `vietnam_info` DB, bam2와 같은 로컬 Postgres 18 인스턴스)
- `AUTH_SECRET` — 세션 쿠키 HMAC 서명 키 (필수)
- 선택: `NEXT_PUBLIC_CLOUDINARY_*`, `EMAIL_SMTP_*`, `GOOGLE_CLIENT_*`, `KAKAO_CLIENT_*`
- ⚠️ Vercel에는 `DATABASE_URL`/`AUTH_SECRET`이 아직 없음 — **설정 전에 push하면 배포가 깨짐**

## 아키텍처

### 데이터 흐름
```
클라이언트 컴포넌트 → src/lib/store.ts (async API 클라이언트) → /api/* Route Handler → src/lib/prisma.ts → PostgreSQL
서버 컴포넌트(메인 페이지, generateMetadata)는 prisma 직접 조회 + src/lib/serialize.ts
```

### 핵심 모듈 (src/lib)
- `store.ts` — 게시글/댓글/투표/신고 API 클라이언트. **모든 함수 async.** 과거 localStorage 스토어를 같은 이름으로 대체한 것
- `auth-context.tsx` — `useAuth()`: user, ready(세션 확인 완료 플래그), login/register/logout, refreshUser, adminSetPoints(userId 기준)
- `session.ts` — 서버 전용. HMAC 쿠키 발급/검증, `getSessionUser()`, `isAdmin()`
- `serialize.ts` — Prisma 모델 → 프론트 JSON 직렬화 (단일 소스)
- `points-server.ts` — 포인트 지급/차감 + PointLog 기록. **포인트는 반드시 서버에서 지급** (글 10P/댓글 5P/로그인 1일 1회 5P, SiteConfig에서 관리자가 조정)
- `points.ts` — 등급 계산(`gradeFromPoints`)·상수. 등급은 DB에 저장하지 않고 points에서 파생
- `mockData.ts` — 카테고리/지역 상수, 타입, nearby 장소 데이터. ~~게시글 mock~~은 DB로 이관됨 (시드 전용)

### DB 스키마 (prisma/schema.prisma)
User / Post / Comment / PostVote(1인 1표, unique [postId,userId]) / Report / PointLog / SiteConfig(싱글톤 id=1).
- enum 대신 문자열 사용 (프론트 값과 1:1 매칭): Post.type=`promotion|free|review`, User.memberType=`general|business|admin`
- Post/Comment는 soft delete(`deletedAt`) + `authorName` 스냅샷(탈퇴/시드 글 표시용, authorId nullable)
- 카운트 캐시: Post.likeCount/dislikeCount/commentCount (투표·댓글 트랜잭션에서 동기 갱신)

### API 권한 규칙
- 글/댓글 작성·투표·신고: 로그인 필수 (401)
- 글 수정/삭제: 작성자 또는 관리자 (403)
- hidden/isPinned/isPaid/type 변경, /api/admin/*: 관리자 전용
- 서버가 항상 최종 검증 — 클라이언트 체크는 UX용

## 컨벤션

- 주석·UI 문구·커밋 메시지는 한국어
- Route Handler에서 동적 파라미터는 `RouteContext<'/api/...'>` 타입 + `await ctx.params` (Next 16)
- 에러 응답 형식: `{ error: "한국어 메시지" }` + 적절한 HTTP status — store.ts가 이를 throw Error로 변환
- 페이지 가드 패턴: `useAuth()`의 `ready`를 확인한 뒤 user 검사 (mypage, admin 참고)

## 시드 계정 (개발용)

| 계정 | 비밀번호 | 권한 |
|------|---------|------|
| asdf1a | asdf1a | 관리자 |
| business@test.com | 1234 | 업소회원 |
| user@test.com | 1234 | 일반회원 |
