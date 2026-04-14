"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getLikeState, toggleLike, getComments, addComment, deleteComment, addReport, StoredComment, ReportReason, REPORT_REASON_LABELS } from "@/lib/store";
import { POINT_REWARDS } from "@/lib/points";

interface Props {
  postId: number;
  baseLikes: number;
  baseCommentCount: number;
  backHref?: string;
  backLabel?: string;
}

export default function PostInteractions({ postId, baseLikes, baseCommentCount, backHref, backLabel = "목록으로" }: Props) {
  const { user, awardPoints } = useAuth();
  const [likeCount, setLikeCount] = useState(baseLikes);
  const [liked, setLiked]         = useState(false);
  const [comments, setComments]   = useState<StoredComment[]>([]);
  const [text, setText]           = useState("");
  const [error, setError]         = useState("");
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "comment"; id: number } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDetail, setReportDetail] = useState("");
  const [reportDone, setReportDone]     = useState(false);

  useEffect(() => {
    const { count, liked } = getLikeState(postId, baseLikes);
    setLikeCount(count);
    setLiked(liked);
    setComments(getComments(postId));
  }, [postId, baseLikes]);

  const handleLike = () => {
    const { count, liked } = toggleLike(postId, baseLikes);
    setLikeCount(count);
    setLiked(liked);
  };

  const handleReport = () => {
    if (!reportTarget) return;
    addReport({
      targetType: reportTarget.type,
      targetId: reportTarget.id,
      postId: reportTarget.type === "comment" ? postId : undefined,
      reporterName: user?.name ?? "익명",
      reason: reportReason,
      detail: reportDetail.trim() || undefined,
    });
    setReportDone(true);
    setTimeout(() => {
      setReportTarget(null);
      setReportReason("spam");
      setReportDetail("");
      setReportDone(false);
    }, 1500);
  };

  const handleDelete = (commentId: number) => {
    deleteComment(postId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return setError("댓글 내용을 입력해주세요.");
    if (!user) return setError("로그인 후 댓글을 작성할 수 있습니다.");
    const c = addComment(postId, user.name, text.trim());
    setComments((prev) => [c, ...prev]);
    awardPoints(POINT_REWARDS.comment);
    setText("");
    setError("");
  };

  const totalComments = comments.length + baseCommentCount;

  return (
    <div className="w-full">
      {/* 좋아요 + 신고 + 목록 버튼 행 */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
            liked
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {liked ? "❤️" : "🤍"} 좋아요 {likeCount}
        </button>
        {user && (
          <button
            onClick={() => setReportTarget({ type: "post", id: postId })}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            🚨 신고
          </button>
        )}
        {backHref && (
          <Link href={backHref} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors ml-auto">
            {backLabel}
          </Link>
        )}
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-800 mb-4">댓글 {totalComments}개</h3>

        {/* 댓글 입력 */}
        <form onSubmit={handleComment} className="flex gap-3 mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
            {user ? user.name[0] : "?"}
          </div>
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={user ? "댓글을 작성해주세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
              disabled={!user}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-red-400 disabled:bg-gray-50 disabled:text-gray-400"
              rows={3}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!user}
                className="bg-red-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-40"
              >
                댓글 등록
              </button>
            </div>
          </div>
        </form>

        {/* 댓글 목록 */}
        {comments.length === 0 && baseCommentCount === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">첫 번째 댓글을 작성해보세요!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-red-700">
                  {c.author[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{c.author}</span>
                    <span className="text-xs text-gray-400">{c.createdAt}</span>
                    <div className="ml-auto flex items-center gap-2">
                      {user && user.name !== c.author && (
                        <button
                          onClick={() => setReportTarget({ type: "comment", id: c.id })}
                          className="text-xs text-gray-300 hover:text-orange-500 transition-colors"
                          aria-label="댓글 신고"
                        >
                          신고
                        </button>
                      )}
                      {(user?.name === c.author || user?.memberType === "admin") && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="댓글 삭제"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 신고 모달 */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            {reportDone ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">✅</p>
                <p className="font-bold text-gray-800">신고가 접수되었습니다.</p>
                <p className="text-sm text-gray-500 mt-1">검토 후 조치하겠습니다.</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 mb-1">
                  {reportTarget.type === "post" ? "게시글" : "댓글"} 신고
                </h3>
                <p className="text-xs text-gray-400 mb-4">허위 신고 시 이용이 제한될 수 있습니다.</p>
                <div className="space-y-2 mb-4">
                  {(Object.entries(REPORT_REASON_LABELS) as [ReportReason, string][]).map(([key, label]) => (
                    <label key={key} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      reportReason === key ? "border-red-400 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                      <input type="radio" name="reportReason" value={key} checked={reportReason === key}
                        onChange={() => setReportReason(key)} className="accent-red-600" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  value={reportDetail}
                  onChange={e => setReportDetail(e.target.value)}
                  placeholder="추가 설명 (선택사항)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:border-red-400 mb-4"
                />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setReportTarget(null)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    취소
                  </button>
                  <button onClick={handleReport}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    신고 제출
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
