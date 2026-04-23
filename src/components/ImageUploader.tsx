"use client";

import { useRef, useState, DragEvent } from "react";
import {
  MediaItem,
  getMediaType,
  validateFileSize,
  uploadMedia,
  isCloudinaryConfigured,
  IMAGE_MAX_MB,
  VIDEO_MAX_MB,
} from "@/lib/cloudinary";

interface Props {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxCount?: number;
  label?: string;
}

export default function MediaUploader({
  items,
  onChange,
  maxCount = 10,
  label = "사진/동영상 업로드",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState("");

  const configured = isCloudinaryConfigured();

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!configured) return;
    setSizeError("");

    const remaining = maxCount - items.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);

    for (const file of selected) {
      const err = validateFileSize(file);
      if (err) { setSizeError(err); return; }
    }

    const placeholders: MediaItem[] = selected.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
      type: getMediaType(file),
      uploading: true,
      progress: 0,
    }));

    let current = [...items, ...placeholders];
    onChange(current);

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      const ph = placeholders[i];

      try {
        const url = await uploadMedia(file, (pct) => {
          current = current.map((item) =>
            item.id === ph.id ? { ...item, progress: pct } : item
          );
          onChange(current);
        });
        URL.revokeObjectURL(ph.url);
        current = current.map((item) =>
          item.id === ph.id
            ? { ...item, url, uploading: false, progress: 100 }
            : item
        );
        onChange(current);
      } catch (err) {
        current = current.map((item) =>
          item.id === ph.id
            ? { ...item, uploading: false, error: err instanceof Error ? err.message : "업로드 실패" }
            : item
        );
        onChange(current);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const canAdd = items.length < maxCount;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        <span className="ml-2 text-xs font-normal text-gray-400">
          ({items.length}/{maxCount})
        </span>
      </label>

      {!configured && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
          Cloudinary 미설정 — .env.local에 CLOUD_NAME · UPLOAD_PRESET 입력 후 재시작하세요.
        </div>
      )}

      {sizeError && (
        <p className="text-xs text-red-600 mb-2">{sizeError}</p>
      )}

      {/* 미리보기 그리드 */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            >
              {item.type === "video" ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              )}

              {/* 동영상 아이콘 */}
              {item.type === "video" && !item.uploading && !item.error && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
                    <span className="text-white text-sm ml-0.5">▶</span>
                  </div>
                </div>
              )}

              {/* 업로드 진행 오버레이 */}
              {item.uploading && (
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1.5 px-2">
                  <span className="text-white text-xs font-bold">{item.progress ?? 0}%</span>
                  <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-150"
                      style={{ width: `${item.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 에러 오버레이 */}
              {item.error && (
                <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center p-1">
                  <span className="text-white text-xs text-center leading-tight">{item.error}</span>
                </div>
              )}

              {/* 삭제 버튼 */}
              {!item.uploading && (
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {canAdd && configured && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-400 transition-colors text-2xl"
            >
              +
            </button>
          )}
        </div>
      )}

      {/* 드래그앤드롭 영역 */}
      {items.length === 0 && configured && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-red-400 bg-red-50"
              : "border-gray-200 hover:border-red-300 hover:bg-gray-50"
          }`}
        >
          <p className="text-3xl mb-2">📎</p>
          <p className="text-sm font-medium text-gray-600">
            클릭하거나 파일을 드래그하세요
          </p>
          <p className="text-xs text-gray-400 mt-1">
            이미지 최대 {IMAGE_MAX_MB}MB · 동영상 최대 {VIDEO_MAX_MB}MB · 최대 {maxCount}개
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />
    </div>
  );
}
