import Link from "next/link";
import { Post, categoryLabels, categoryIcons, gradeColors } from "@/lib/mockData";

interface PostCardProps {
  post: Post;
  showImage?: boolean;
}

export default function PostCard({ post, showImage = false }: PostCardProps) {
  const boardPath = post.type === "promotion" ? "promotion" : post.type === "free" ? "free" : "review";

  return (
    <Link href={`/board/${boardPath}/${post.id}`}>
      <div className={`bg-white rounded-lg border ${post.isPaid ? "border-yellow-300 shadow-sm" : "border-gray-200"} p-4 hover:shadow-md transition-shadow group`}>
        {post.isPaid && (
          <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold mb-2">
            <span aria-hidden="true">⭐</span>
            <span>프리미엄</span>
          </div>
        )}

        <div className="flex gap-3">
          {showImage && post.imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.imageUrl}
              alt={post.title}
              loading="lazy"
              decoding="async"
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {post.category && (
                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {categoryIcons[post.category]} {categoryLabels[post.category]}
                </span>
              )}
              {post.district && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {post.district}
                </span>
              )}
              {post.rating && (
                <span className="text-xs text-yellow-500" aria-label={`별점 ${post.rating}점`}>
                  {"★".repeat(post.rating)}{"☆".repeat(5 - post.rating)}
                </span>
              )}
            </div>

            <h3 className="font-medium text-gray-900 line-clamp-1 group-hover:text-red-700 transition-colors text-sm">
              {post.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.content}</p>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{post.author}</span>
                {post.authorGrade && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${gradeColors[post.authorGrade]}`}>
                    {post.authorGrade}
                  </span>
                )}
              </div>
              {/* text-gray-500 (4.6:1 대비) — gray-400는 WCAG AA 미달 */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span aria-label={`조회 ${post.views.toLocaleString()}`}>👁 {post.views.toLocaleString()}</span>
                <span aria-label={`댓글 ${post.commentCount}`}>💬 {post.commentCount}</span>
                <span>{post.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
