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
      <div className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
        <span>⭐</span>
        <span>프리미엄 광고</span>
      </div>
      <div className="relative h-48 sm:h-56">
        <Image
          src={ad.imageUrl}
          alt={ad.name}
          fill
          className="object-cover"
          unoptimized
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
        <div className="flex gap-1">
          {paidAds.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-red-600" : "bg-gray-300"}`}
            />
          ))}
        </div>
        <Link
          href={ad.href}
          className="text-xs bg-red-700 text-white px-3 py-1.5 rounded-lg hover:bg-red-800 transition-colors"
        >
          자세히 보기
        </Link>
      </div>
    </div>
  );
}
