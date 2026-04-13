"use client";

import Link from "next/link";
import Image from "next/image";
import { paidAds } from "@/lib/mockData";
import { useState, useEffect } from "react";

export default function AdBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % paidAds.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const ad = paidAds[current];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-yellow-200">
      <div className="bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 flex items-center gap-1">
        <span aria-hidden="true">⭐</span>
        <span>프리미엄 광고</span>
      </div>
      <div className="relative h-48 sm:h-56">
        <Image
          src={ad.imageUrl}
          alt={ad.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="font-bold text-lg">{ad.name}</p>
          <p className="text-sm text-gray-200">{ad.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{ad.district}</span>
            <span className="text-xs">{ad.phone}</span>
          </div>
        </div>
      </div>
      <div className="p-3 flex items-center justify-between">
        {/* 캐러셀 도트 — 클릭 영역 p-2로 확장, aria-label 추가 */}
        <div className="flex gap-1" role="tablist" aria-label="광고 목록">
          {paidAds.map((a, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`${a.name} 광고 보기`}
              onClick={() => setCurrent(i)}
              className="p-2 -m-1 flex items-center justify-center"
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors block ${i === current ? "bg-red-600" : "bg-gray-300"}`}
              />
            </button>
          ))}
        </div>
        <Link
          href={ad.href}
          className="text-xs bg-red-700 text-white px-3 py-1.5 rounded-lg hover:bg-red-800 transition-colors"
        >
          자세히 보기
          <span className="sr-only"> - {ad.name}</span>
        </Link>
      </div>
    </div>
  );
}
