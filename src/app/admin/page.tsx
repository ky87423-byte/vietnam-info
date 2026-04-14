"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getUserPosts, deletePost, getAllComments, deleteComment,
  updatePost, getMockOverrides, setMockHidden,
  StoredPost, StoredComment,
} from "@/lib/store";
import { freePosts, reviewPosts, promotionPosts, Post } from "@/lib/mockData";

type Tab = "dashboard" | "posts" | "comments" | "users";
type AnyPost = (Post | StoredPost) & { source: "mock" | "user"; _hidden?: boolean };
type BoardType = "free" | "review" | "promotion";

const BOARD_LABELS: Record<BoardType, string> = {
  free: "자유게시판",
  review: "후기게시판",
  promotion: "홍보게시판",
};

function loadUsers() {
  try {
    const raw = localStorage.getItem("vn_users");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function deleteUser(email: string) {
  try {
    const raw = localStorage.getItem("vn_users");
    if (!raw) return;
    const users = JSON.parse(raw).filter((u: { email: string }) => u.email !== email);
    localStorage.setItem("vn_users", JSON.stringify(users));
    const session = localStorage.getItem("vn_session");
    if (session && JSON.parse(session).email === email) localStorage.removeItem("vn_session");
  } catch {}
}

const typeLabel: Record<string, string> = { free: "자유", review: "후기", promotion: "홍보" };
const memberLabel: Record<string, string> = { admin: "관리자", business: "업소회원", general: "일반회원" };
const memberBadge: Record<string, string> = {
  admin:    "bg-red-100 text-red-700",
  business: "bg-yellow-100 text-yellow-700",
  general:  "bg-blue-100 text-blue-700",
};

export default function AdminPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [tab, setTab]               = useState<Tab>("dashboard");
  const [allPosts, setAllPosts]     = useState<AnyPost[]>([]);
  const [comments, setComments]     = useState<(StoredComment & { postId: number })[]>([]);
  const [users, setUsers]           = useState<ReturnType<typeof loadUsers>>([]);
  const [postSearch, setPostSearch] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);

  // 이동 모달
  const [moveTarget, setMoveTarget] = useState<AnyPost | null>(null);
  const [moveTo, setMoveTo]         = useState<BoardType>("free");

  // 삭제 확인 모달
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string | number } | null>(null);

  useEffect(() => {
    if (!user) { router.replace("/auth/login"); return; }
    if (user.memberType !== "admin") { router.replace("/"); return; }
  }, [user, router]);

  const refresh = useCallback(() => {
    const overrides = getMockOverrides();
    const userPosts = getUserPosts();
    const mock: AnyPost[] = [
      ...freePosts.map(p  => ({ ...p, source: "mock" as const, _hidden: overrides[p.id]?.hidden ?? false })),
      ...reviewPosts.map(p => ({ ...p, source: "mock" as const, _hidden: overrides[p.id]?.hidden ?? false })),
      ...promotionPosts.map(p => ({ ...p, source: "mock" as const, _hidden: overrides[p.id]?.hidden ?? false })),
    ];
    const stored: AnyPost[] = userPosts.map(p => ({
      ...p, source: "user" as const, _hidden: (p as StoredPost).hidden ?? false,
    }));
    setAllPosts([...stored, ...mock].sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    ));
    setComments(getAllComments());
    setUsers(loadUsers());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!user || user.memberType !== "admin") return null;

  /* ── 숨김 토글 ── */
  const handleToggleHide = (p: AnyPost) => {
    const nextHidden = !p._hidden;
    if (p.source === "user") {
      updatePost(p.id, { hidden: nextHidden });
    } else {
      setMockHidden(p.id, nextHidden);
    }
    refresh();
  };

  /* ── 이동 확정 ── */
  const handleMove = () => {
    if (!moveTarget) return;
    if (moveTarget.source === "user") {
      updatePost(moveTarget.id, { type: moveTo });
    }
    // mock 게시글은 이동 불가 (UI에서 비활성화)
    setMoveTarget(null);
    refresh();
  };

  /* ── 삭제 확정 ── */
  const confirmAndDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "post")    deletePost(Number(confirmDelete.id));
    if (confirmDelete.type === "comment") {
      const c = comments.find(c => c.id === confirmDelete.id);
      if (c) deleteComment(c.postId, c.id);
    }
    if (confirmDelete.type === "user")    deleteUser(String(confirmDelete.id));
    setConfirmDelete(null);
    refresh();
  };

  const filteredPosts = allPosts.filter(p => {
    if (!showHidden && p._hidden) return false;
    const q = postSearch.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q);
  });

  const filteredComments = comments.filter(c => {
    const q = commentSearch.toLowerCase();
    return c.content.toLowerCase().includes(q) || c.author.toLowerCase().includes(q);
  });

  const filteredUsers = users.filter((u: { name: string; email: string }) => {
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const userPostsCount = allPosts.filter(p => p.source === "user").length;
  const hiddenCount    = allPosts.filter(p => p._hidden).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.name}님 ({user.email})</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-red-700 transition-colors">
          ← 사이트로 돌아가기
        </Link>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {([
          { key: "dashboard", label: "대시보드" },
          { key: "posts",     label: `게시글 (${allPosts.length})` },
          { key: "comments",  label: `댓글 (${comments.length})` },
          { key: "users",     label: `회원 (${users.length})` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? "border-red-600 text-red-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 대시보드 ── */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "전체 게시글", value: allPosts.length,    color: "bg-blue-50 text-blue-700"   },
              { label: "회원 작성글", value: userPostsCount,     color: "bg-green-50 text-green-700"  },
              { label: "숨김 게시글", value: hiddenCount,        color: "bg-orange-50 text-orange-700" },
              { label: "전체 회원",   value: users.length,       color: "bg-purple-50 text-purple-700" },
            ].map(stat => (
              <div key={stat.label} className={`rounded-xl p-5 ${stat.color.split(" ")[0]}`}>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color.split(" ")[1]}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* 최근 회원 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-800 mb-4">최근 가입 회원</h2>
            {users.length === 0
              ? <p className="text-sm text-gray-400">가입한 회원이 없습니다.</p>
              : (
                <div className="space-y-2">
                  {users.slice(0, 5).map((u: { email: string; name: string; memberType: string; createdAt: string }) => (
                    <div key={u.email} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">{u.name[0]}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${memberBadge[u.memberType] ?? "bg-gray-100 text-gray-600"}`}>
                        {memberLabel[u.memberType] ?? u.memberType}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* 최근 회원 작성글 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-800 mb-4">최근 게시글 (회원 작성)</h2>
            {userPostsCount === 0
              ? <p className="text-sm text-gray-400">회원이 작성한 게시글이 없습니다.</p>
              : (
                <div className="space-y-2">
                  {allPosts.filter(p => p.source === "user").slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.author} · {p.createdAt} · {typeLabel[p.type]}</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{typeLabel[p.type]}</span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* ── 게시글 관리 ── */}
      {tab === "posts" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="제목 또는 작성자 검색..."
              value={postSearch}
              onChange={e => setPostSearch(e.target.value)}
              className="flex-1 min-w-48 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            <button
              onClick={() => setShowHidden(v => !v)}
              className={`px-4 py-2.5 text-sm rounded-lg border transition-colors ${
                showHidden
                  ? "bg-orange-50 border-orange-300 text-orange-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {showHidden ? "👁 숨김 포함 중" : "숨김 게시글 보기"} {hiddenCount > 0 && `(${hiddenCount})`}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">제목</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">작성자</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">구분</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPosts.map(p => (
                  <tr key={`${p.source}-${p.id}`}
                    className={`transition-colors ${p._hidden ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p._hidden && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">숨김</span>
                        )}
                        <p className="font-medium text-gray-800 line-clamp-1 max-w-xs">{p.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.author}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.source === "user" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {p.source === "user" ? "회원" : "기본"} · {typeLabel[p.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* 이동 — 유저 게시글만 */}
                        {p.source === "user" && (
                          <button
                            onClick={() => { setMoveTarget(p); setMoveTo(p.type as BoardType); }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50"
                          >
                            이동
                          </button>
                        )}
                        {/* 숨김/공개 */}
                        <button
                          onClick={() => handleToggleHide(p)}
                          className={`text-xs font-medium transition-colors px-2 py-1 rounded ${
                            p._hidden
                              ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                              : "text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                          }`}
                        >
                          {p._hidden ? "공개" : "숨김"}
                        </button>
                        {/* 삭제 — 유저 게시글만 */}
                        {p.source === "user" && (
                          <button
                            onClick={() => setConfirmDelete({ type: "post", id: p.id })}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPosts.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">검색 결과가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 댓글 관리 ── */}
      {tab === "comments" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="내용 또는 작성자 검색..."
            value={commentSearch}
            onChange={e => setCommentSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
          />
          {filteredComments.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {comments.length === 0 ? "아직 작성된 댓글이 없습니다." : "검색 결과가 없습니다."}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {filteredComments.map(c => (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-red-700">
                    {c.author[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{c.author}</span>
                      <span className="text-xs text-gray-400">{c.createdAt}</span>
                      <span className="text-xs text-gray-400">게시글 #{c.postId}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{c.content}</p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete({ type: "comment", id: c.id })}
                    className="text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 회원 관리 ── */}
      {tab === "users" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
          />
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">회원</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">이메일</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">등급</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">가입일</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u: { email: string; name: string; memberType: string; createdAt: string }) => (
                  <tr key={u.email} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{u.name[0]}</div>
                        <span className="font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${memberBadge[u.memberType] ?? "bg-gray-100 text-gray-600"}`}>
                        {memberLabel[u.memberType] ?? u.memberType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{u.createdAt}</td>
                    <td className="px-4 py-3 text-right">
                      {u.email === user.email ? (
                        <span className="text-xs text-gray-300">본인</span>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete({ type: "user", id: u.email })}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">검색 결과가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 이동 모달 ── */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">게시글 이동</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-1">"{moveTarget.title}"</p>
            <div className="space-y-2 mb-5">
              {(Object.entries(BOARD_LABELS) as [BoardType, string][]).map(([key, label]) => (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  moveTo === key ? "border-red-400 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                }`}>
                  <input
                    type="radio"
                    name="moveTo"
                    value={key}
                    checked={moveTo === key}
                    onChange={() => setMoveTo(key)}
                    className="accent-red-600"
                  />
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                  {moveTarget.type === key && (
                    <span className="ml-auto text-xs text-gray-400">현재</span>
                  )}
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setMoveTarget(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button
                onClick={handleMove}
                disabled={moveTo === moveTarget.type}
                className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-40"
              >
                이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">삭제 확인</h3>
            <p className="text-sm text-gray-600 mb-5">정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={confirmAndDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
