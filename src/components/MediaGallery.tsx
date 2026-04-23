"use client";

import { useState } from "react";
import { detectUrlType } from "@/lib/cloudinary";

interface Props {
  urls: string[];
}

export default function MediaGallery({ urls }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!urls || urls.length === 0) return null;

  const imageUrls = urls.filter((u) => detectUrlType(u) === "image");
  const lightboxPrev = () =>
    setLightbox((i) => (i !== null ? (i - 1 + imageUrls.length) % imageUrls.length : null));
  const lightboxNext = () =>
    setLightbox((i) => (i !== null ? (i + 1) % imageUrls.length : null));

  const imageCount = imageUrls.length;

  return (
    <>
      <div className="space-y-3">
        {/* 이미지 그리드 */}
        {imageUrls.length > 0 && (
          <div
            className={`grid gap-2 ${
              imageCount === 1
                ? "grid-cols-1"
                : imageCount === 2
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            {imageUrls.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightbox(i)}
                className={`overflow-hidden rounded-xl bg-gray-100 ${
                  imageCount === 1 ? "aspect-video" : "aspect-square"
                }`}
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
        )}

        {/* 동영상 목록 */}
        {urls
          .filter((u) => detectUrlType(u) === "video")
          .map((src, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-black">
              <video
                src={src}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[480px]"
              />
            </div>
          ))}
      </div>

      {/* 라이트박스 */}
      {lightbox !== null && imageUrls.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrls[lightbox]}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
          >
            ✕
          </button>

          {imageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl w-10 h-10 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl w-10 h-10 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
                {lightbox + 1} / {imageUrls.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
