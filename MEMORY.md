# 프로젝트 메모리 — 베트남인포

> 마지막 갱신: 2026-06-05. 세부 작업 이력은 `docs/worklog.md`, 코드 가이드는 `CLAUDE.md` 참고.

## 1. 프로젝트 목적

**호치민(베트남) 한인 대상 생활정보 + 업소 홍보 커뮤니티 플랫폼.**

- 타깃: 호치민 거주 교민·주재원·여행자
- 콘텐츠: 맛집/골프/숙소/렌트카/마사지/기타 업소 정보 + 자유·후기 게시판
- 수익 모델(예정): 업소회원의 홍보게시판 유료 광고(프리미엄 노출) → 향후 샵 시스템 + 쿠폰으로 확장
- 차별점: Google Maps 기반 "내주변" 업소 탐색 (참조 프로젝트 bam2에는 없는 기능)
- 운영 원칙: bam2(성인 사이트)와 **인프라·IP 완전 분리** — 건전 사이트로서 평판·차단 리스크 차단

## 2. 현재 완료된 기능

### 사용자 기능
- [x] 회원가입(일반/업소 구분) · 로그인 · 로그아웃 — bcrypt + httpOnly 세션 쿠키
- [x] 아이디(이메일 외 형식)로도 로그인 가능
- [x] 비밀번호 찾기 — 이메일 인증코드(nodemailer, SMTP 미설정 시 콘솔 dev 모드) → 재설정
- [x] 소셜 로그인 UI (Google/Kakao — OAuth 키는 Vercel에만 있어 로컬 미동작)
- [x] 게시판 3종: 홍보(카테고리·지역 필터, 연락처 4종, 프리미엄 노출) / 자유 / 후기(별점 1~5)
- [x] 글 작성·수정·삭제(soft delete), 이미지·동영상 첨부(Cloudinary, 글당 10개)
- [x] 댓글 작성·삭제
- [x] DC갤 스타일 추천/비추천 — **1인 1표, 토글/교체** (자유·후기), 홍보는 좋아요만
- [x] 신고(글/댓글, 사유 5종)
- [x] 포인트: 글 +10P / 댓글 +5P / 로그인 1일 1회 +5P — **전부 서버 지급** + PointLog 이력
- [x] 등급 5단계 (새싹 0 → 일반 100 → 우수 500 → 전문가 1500 → VIP 5000, points에서 파생)
- [x] 검색(제목+내용), 마이페이지(프로필·등급 진행바·내 글 탭), 내주변 지도(Google Maps, mock 장소 21곳)
- [x] 모바일 대응(DC갤 스타일 목록), SEO 메타데이터, PWA, CSP 보안 헤더

### 관리자 기능 (`/admin`, 5탭)
- [x] 대시보드: 통계 카드, 최근 가입/게시글, **포인트 지급량 설정(SiteConfig)**
- [x] 게시글: 검색, 숨김/공개, 상단 고정(📌), 게시판 간 이동, 삭제
- [x] 댓글: 전체 목록·검색·삭제
- [x] 회원: 통합 검색(이름·이메일·작성글 내용), 상세 모달(글/댓글), 포인트·등급 직접 수정, 차단/삭제
- [x] 신고: 상태 처리(대기→처리완료/기각)

## 3. 사용 중인 API (Route Handler 21개)

### 인증 `/api/auth/*`
| 메서드 | 경로 | 기능 |
|--------|------|------|
| POST | `/api/auth/register` | 가입(중복 검사, 즉시 세션 발급) |
| POST | `/api/auth/login` | 로그인 + 1일 1회 포인트, blocked 차단 |
| POST | `/api/auth/logout` | 세션 쿠키 삭제 |
| GET | `/api/auth/me` | 현재 세션 유저 |
| GET/POST | `/api/auth/reset-password` | 유저 존재 확인 / 비밀번호 재설정 |
| POST | `/api/auth/send-reset-code` | 인증코드 이메일 발송 (DB 전환 이전부터 존재) |
| * | `/api/auth/[...nextauth]` | NextAuth OAuth (Google/Kakao) |

### 게시글·댓글·투표·신고
| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET/POST | `/api/posts` | 목록(type/q/author/all 필터, 고정 우선) / 작성(+10P) |
| GET/PATCH/DELETE | `/api/posts/[id]` | 상세(`?view=1` 조회수) / 수정(관리자: hidden·isPinned·isPaid·type) / soft delete |
| GET/POST | `/api/posts/[id]/comments` | 댓글 목록 / 작성(+5P, commentCount 동기화) |
| DELETE | `/api/comments/[id]` | 댓글 삭제 (작성자/관리자) |
| GET/POST | `/api/posts/[id]/vote` | 내 투표 상태 / 추천·비추천 토글(1인 1표) |
| GET/POST | `/api/reports` | 신고 목록(관리자) / 접수 |
| PATCH | `/api/reports/[id]` | 신고 상태 변경(관리자) |

### 관리자 `/api/admin/*` (전부 admin 전용)
| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/admin/users` | 회원 목록 |
| PATCH/DELETE | `/api/admin/users/[id]` | 포인트(PointLog 기록)·차단 / 삭제(본인 불가) |
| GET | `/api/admin/comments` | 전체 댓글 |
| GET/PATCH | `/api/admin/config` | 포인트 지급량 조회/변경 |

### 외부 API
- Cloudinary unsigned upload (클라이언트 직접, `NEXT_PUBLIC_CLOUDINARY_*`)
- Google Maps JS API (`/nearby`)

## 4. DB 상태

- **로컬**: PostgreSQL 18 (localhost:5432, bam2와 같은 인스턴스) / DB명 `vietnam_info`
- **마이그레이션**: `20260605074901_init` 1개 적용됨
- **모델 7개**: User, Post, Comment, PostVote, Report, PointLog, SiteConfig
- **현재 데이터** (2026-06-05 기준):
  | 테이블 | 행 수 | 비고 |
  |--------|------|------|
  | User | 3 | 시드 계정 (관리자 asdf1a / 업소 business@test.com / 일반 user@test.com) |
  | Post | 22 (live 21) | mock 이관 21건 + 스모크 테스트 #206(soft delete됨) |
  | Comment | 1 | 스모크 테스트 잔여 |
  | PostVote | 1 | 스모크 테스트 잔여 |
  | PointLog | 3 | 로그인/글/댓글 지급 이력 |
  | Report | 0 | |
- **프로덕션 DB: 아직 없음** — Neon/Supabase 무료 티어로 생성 예정
- 구 localStorage 데이터(vn_posts 등)는 폐기 결정 (프로토타입 데이터)

## 5. 배포 상태

| 항목 | 상태 |
|------|------|
| Vercel 프로덕션 | https://vietnam-info.vercel.app — **DB 전환 이전 코드(localStorage 버전)가 서비스 중** |
| 로컬 master | 커밋 `a43cc4b`(DB 전환) + 문서 3종(미커밋) — **push 안 함** |
| push 보류 이유 | Vercel에 `DATABASE_URL`/`AUTH_SECRET` 없음 → 지금 push하면 배포 즉시 깨짐 |
| 확정 배포 구성 | Vercel(프론트) + **Neon/Supabase 무료 PostgreSQL**(DB) — bam2 VPS(bt-001.com, Shinjiru) 동거안은 IP차단·해킹 전이·DNS 히스토리 흔적 리스크로 폐기 |
| 도메인 | 미정 — 사용자가 직접 구매해 Vercel 연결 예정 (도메인비 연 1.5~2만원 외 추가 비용 없음) |
| 수익화 시점 주의 | Vercel 무료(Hobby)는 비상업 용도 — 광고 수익화하면 Pro($20/월) 전환 또는 VPS 이전 필요 |

## 6. 해결 안 된 문제

### push 차단 요인 (즉시)
- [ ] 프로덕션 DB 없음 → Neon/Supabase 생성 필요
- [ ] Vercel 환경변수 미등록 (`DATABASE_URL`, `AUTH_SECRET` — **로컬 값 재사용 금지, 새로 생성**)
- [ ] 시드 관리자 계정 `asdf1a/asdf1a` 비밀번호 취약 — 프로덕션 시드 전 반드시 변경

### 기능상 미해결 (낮은 우선순위)
- [ ] 소셜 로그인(NextAuth)이 자체 세션과 **통합 안 됨** — OAuth로 로그인해도 vn_session/User 테이블과 연결되지 않음 (현재 사실상 장식)
- [ ] 비밀번호 재설정 인증코드 검증이 **클라이언트 메모리(ref)에서 수행** — 서버 검증으로 옮겨야 안전
- [ ] 게시글 목록 페이지네이션이 클라이언트 슬라이스(take 500 후) — 글 많아지면 서버 페이지네이션 필요
- [ ] 조회수 중복 방지 없음 (새로고침마다 +1)
- [ ] Cloudinary unsigned preset — 악용 시 타인이 업로드 가능, 향후 signed 방식 검토
- [ ] 관리자 페이지가 832줄 단일 파일 — 탭별 컴포넌트 분리 필요
- [ ] 테스트 코드 없음 (bam2는 vitest 있음 — 패턴 가져올 것)
- [ ] DB에 스모크 테스트 잔여 데이터 (Comment 1, PostVote 1) — 프로덕션 시드와 무관하나 로컬 정리 가능

## 7. 다음 작업 순서

```
① 배포 (push 차단 해제) ← 다음 세션 시작점
   1. Neon(또는 Supabase) 가입 → 프로젝트 생성 → DATABASE_URL 확보
   2. prisma migrate deploy + db:seed (관리자 비밀번호 변경 후)
   3. Vercel 환경변수 등록 → 문서 3종 커밋 → git push → 배포 확인
   4. 도메인 구매·연결 (이름 미정)

② 샵(업소) 시스템 — bam2 이식 (수익화 핵심)
   - 업소회원 대시보드, 샵 페이지(/shop/[id]), 쿠폰 발급·검증
   - 베트남 차별점: nearby 지도와 결합 (지도에서 업소 보기)

③ 커뮤니티 활성화
   - 출석체크(기존 포인트 시스템에 연결), 쪽지(DM)+헤더 안읽음 뱃지, 익명게시판

④ 운영 도구
   - 관리자 통계 차트(recharts), 회원 랭킹, 문의 접수
   - 이 시점에 6번의 기능상 미해결 항목(페이지네이션, 소셜 로그인 통합 등) 함께 정리
```

## 참고: bam2와의 관계

- bam2(`C:\Users\User\bam2_info`, bt-001.com)는 같은 개발자의 선행 프로젝트 — 스키마/세션/포인트 패턴의 출처
- 2~4단계 구현 시 bam2 코드(쿠폰·쪽지·출석·analytics) 참조해 이식
- 로컬 개발 DB만 같은 Postgres 인스턴스 공유, **프로덕션 인프라는 절대 공유하지 않음**
