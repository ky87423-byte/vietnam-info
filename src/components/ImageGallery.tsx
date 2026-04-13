"use client";

import { useState } from "react";

interface Props {
  images: string[];
}

export default function ImageGallery({ images }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) return null;

  const prev = () =>
    setLightbox((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  const next = () =>
    setLightbox((i) => (i !== null ? (i + 1) % images.length : null));

  return (
    <>
      {/* 썸네일 그리드 */}
      <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(i)}
            className={`overflow-hidden rounded-xl bg-gray-100 ${images.length === 1 ? "aspect-video" : "aspect-square"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`첨부 이미지 ${i + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          </button>
        ))}
      </div>

      {/* 라이트박스 */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox]}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* 닫기 */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
          >
            ✕
          </button>

          {/* 이전/다음 (2장 이상일 때) */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl w-10 h-10 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl w-10 h-10 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
                {lightbox + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
