"use client";

import { useRef, useState, DragEvent } from "react";
import { compressImage } from "@/lib/imageUtils";

interface Props {
  images: string[];           // base64 data URLs
  onChange: (images: string[]) => void;
  maxCount?: number;
  label?: string;
}

export default function ImageUploader({
  images,
  onChange,
  maxCount = 5,
  label = "사진 업로드",
}: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [loading, setLoading]  = useState(false);
  const [dragging, setDragging] = useState(false);

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxCount - images.length;
    if (remaining <= 0) return;

    setLoading(true);
    const selected = Array.from(files).slice(0, remaining);
    try {
      const compressed = await Promise.all(
        selected.map((f) => compressImage(f))
      );
      onChange([...images, ...compressed]);
    } catch {
      // 압축 실패 시 무시
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx: number) =>
    onChange(images.filter((_, i) => i !== idx));

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const canAdd = images.length < maxCount;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        <span className="ml-2 text-xs font-normal text-gray-400">
          ({images.length}/{maxCount}장)
        </span>
      </label>

      {/* 미리보기 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-400 transition-colors text-2xl disabled:opacity-50"
            >
              {loading ? (
                <span className="text-xs">압축중...</span>
              ) : "+"}
            </button>
          )}
        </div>
      )}

      {/* 드래그앤드롭 영역 (이미지 없을 때만) */}
      {images.length === 0 && (
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
          {loading ? (
            <p className="text-sm text-gray-500">이미지 처리 중...</p>
          ) : (
            <>
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm font-medium text-gray-600">
                클릭하거나 이미지를 여기에 드래그하세요
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG · 최대 {maxCount}장 · 자동 압축 적용
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />
    </div>
  );
}
