# 작업 일지 — 베트남인포

최신 항목이 위에 오도록 기록.

---

## 2026-06-05 — localStorage → PostgreSQL DB 전환 (커밋 `a43cc4b`)

### 배경
기존 구조는 모든 데이터(게시글·댓글·회원·포인트)가 **브라우저 localStorage**에 저장되어, 사용자 간 데이터 공유가 불가능한 프로토타입 상태였다. bam2 프로젝트의 Prisma 패턴을 기반으로 실제 DB 기반 서비스로 전환.

### 인프라
- 로컬 PostgreSQL 18(bam2와 공유 인스턴스)에 `vietnam_info` DB 생성
- Prisma 7 + `@prisma/adapter-pg`, 클라이언트 출력 `src/generated/prisma` (gitignore)
- `prisma migrate dev --name init` → `prisma/migrations/20260605074901_init`
- `.env`: `DATABASE_URL`, `AUTH_SECRET` (랜덤 48바이트 hex)
- `scripts/seed.ts`: 시드 계정 3개(bcrypt) + mock 게시글 21건을 **원래 id 유지**한 채 이관(기존 URL 보존), 시퀀스 setval 보정, `skipDuplicates`로 재실행 안전

### DB 스키마 (7개 모델)
| 모델 | 핵심 설계 |
|------|----------|
| User | email/name unique, memberType 문자열, points(등급은 파생), lastLoginDate로 1일 1회 로그인 보너스 |
| Post | type 문자열, authorName 스냅샷 + authorId nullable(SetNull), 연락처 4컬럼, imageUrls[], like/dislike/comment 카운트 캐시, hidden/isPinned/isPaid, soft delete |
| Comment | authorName 스냅샷, soft delete, post cascade |
| PostVote | value(1/-1), `@@unique([postId, userId])` — 1인 1표 |
| Report | targetType post/comment, status pending/resolved/dismissed |
| PointLog | action/amount/balance 스냅샷 — 포인트 이력 추적 |
| SiteConfig | 싱글톤(id=1) — 포인트 지급량 설정 (글 10/댓글 5/로그인 5) |

### 백엔드 — API Route 19개 신규
- 인증: `POST /api/auth/{login,register,logout}`, `GET /api/auth/me`, `GET+POST /api/auth/reset-password`
  - 세션: HMAC-SHA256 서명 httpOnly 쿠키 `vn_session` (`src/lib/session.ts`, 30일, prod에서 secure)
  - 로그인 시 1일 1회 포인트 자동 지급, blocked 계정 차단
- 게시글: `GET+POST /api/posts`(목록: type/q/author/all 필터, 고정글 우선 정렬), `GET+PATCH+DELETE /api/posts/[id]`(`?view=1` 조회수 증가, 관리자만 hidden/isPinned/isPaid/type 변경)
- 댓글: `GET+POST /api/posts/[id]/comments`, `DELETE /api/comments/[id]` — commentCount 트랜잭션 동기화
- 투표: `GET+POST /api/posts/[id]/vote` — 토글/교체(추천↔비추천) 로직 서버 처리
- 신고: `GET+POST /api/reports`, `PATCH /api/reports/[id]`
- 관리자: `GET /api/admin/users`, `PATCH+DELETE /api/admin/users/[id]`(포인트 조정은 PointLog에 admin 액션 기록), `GET /api/admin/comments`, `GET+PATCH /api/admin/config`
- 포인트 지급이 전부 서버로 이동 (`src/lib/points-server.ts`) — 클라이언트 조작 불가

### 프론트엔드 — 16개 파일 전환
- `src/lib/store.ts`: localStorage 스토어 → **동일 함수명의 async API 클라이언트**로 재작성 (페이지 수정량 최소화 전략)
- `src/lib/auth-context.tsx`: API 기반 재작성. `ready` 플래그 추가(세션 확인 완료 전 리다이렉트 방지), `awardPoints`는 deprecated(refreshUser로 동작), `adminSetPoints`는 email → userId 기준으로 변경
- 게시판 목록 3개: mock+localStorage 병합 로직 제거 → `getPosts(type)` 단일 호출, isPinned 정렬은 서버
- 상세 3개: `getPost(id, view=true)` (조회수 서버 증가), canEdit은 `user.id === post.authorId` 기준
- 작성/수정 6개: async 제출 + submitting 상태 + 서버 에러 표시
- PostInteractions: 추천/비추천을 서버 투표 API로 (비로그인 시 에러 안내), 댓글 작성자는 세션에서
- 관리자(832줄): 회원탭 API 연동(id 기준 삭제·포인트), 포인트 설정 SiteConfig 연동, 신고 처리 async, mock/user 구분 제거(전체 글 이동·삭제 가능)
- 메인 페이지·generateMetadata 3개: 서버 컴포넌트에서 prisma 직접 조회로 전환 (mock import 제거)
- PostCard: 구조적 `CardPost` 타입으로 변경 (mock Post / API StoredPost 모두 수용)

### 검증
- `tsc --noEmit` 통과, `next build` 통과 (37 routes)
- E2E 스모크 테스트 (port 3456, curl 쿠키 jar): 로그인(+5P) → 글 작성 #206(+10P) → 댓글(+5P) → 추천(likes=1) → me(포인트 120 일치) → 삭제 — 전부 정상
- 삽질 기록: ① npm install을 홈 디렉터리에서 실행해버려 정리 후 재실행 ② 포트 3000/3210 타 프로젝트 점유 ③ PowerShell `Invoke-WebRequest`는 prod secure 쿠키를 http로 안 보내고 Cookie 헤더도 제한됨 → **API 테스트는 curl -c/-b 사용할 것**

### 결정사항
- **배포 구성**: bam2 VPS 동거안 폐기 (성인 사이트와 IP 공유 시 차단·해킹 전이·DNS 히스토리 흔적 리스크) → **Vercel + Neon/Supabase 무료 DB**로 확정
- push 보류 — Vercel에 DATABASE_URL/AUTH_SECRET 등록 후 push (MEMORY.md 체크리스트 참고)

---

## 2026-06-05 이전 — 프로토타입 구축 (localStorage 기반)

git 이력 요약:

| 커밋 | 내용 |
|------|------|
| `7b8737f` | 후기게시판 테스트 게시글 추가 |
| `76d22b3` | 자유/후기게시판 모바일 DC인사이드 갤러리 스타일 |
| `690165e` | DC갤 스타일 추천/비추천 시스템 (자유·후기) |
| `9ac78f5` | 관리자 회원탭 — 통합 검색 + 회원 상세 모달 |
| `743a00c` | 로그인 이메일 형식 제한 해제 (아이디 로그인 허용) |
| `df2ebe8` | 포인트/등급 시스템, 신고, 고정글, 관리자 기능 |
| `6dd7058` | 관리자 게시글 이동/숨김/삭제 |
| `25cc2bf` | 관리자 페이지, 댓글 삭제, PWA, 소셜 로그인(Google/Kakao) |
| `7b3ebd3` | Lighthouse 접근성 개선 (86 → ~95) |
| `9d3c689` | 보안 취약점 수정 및 성능 향상 (CSP 헤더 등) |
| `44d7ceb` | SEO 메타데이터 전체 페이지 적용 |

이 시기 구축된 화면: 메인(히어로+프리미엄 광고+최근 글), 홍보/자유/후기 게시판(목록·상세·작성·수정), 내주변 지도(Google Maps, 720줄), 검색, 마이페이지, 관리자(5탭), 로그인/가입/비밀번호 찾기(이메일 인증코드).
