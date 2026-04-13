"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import {
  nearbyPlaces, markerColors, categoryIcons, categoryLabels,
  NearbyPlace, Category,
} from "@/lib/mockData";

const HCM_CENTER = { lat: 10.7769, lng: 106.7009 };
const ALL_CATEGORIES: Category[] = ["food", "golf", "hotel", "rent", "exchange", "etc"];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeSvgMarker(color: string, emoji: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
      <path d="M20 0C8.954 0 0 8.954 0 20c0 13.5 20 32 20 32S40 33.5 40 20C40 8.954 31.046 0 20 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="20" cy="20" r="13" fill="white" opacity="0.95"/>
      <text x="20" y="26" text-anchor="middle" font-size="15">${emoji}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeUserDot() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#4285F4" opacity="0.25"/>
      <circle cx="12" cy="12" r="6" fill="#4285F4" stroke="white" stroke-width="2"/>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// importLibrary로 가져온 클래스들을 저장할 타입
type MapsLib   = Awaited<ReturnType<typeof importLibrary<"maps">>>;
type MarkerLib = Awaited<ReturnType<typeof importLibrary<"marker">>>;
type CoreLib   = Awaited<ReturnType<typeof importLibrary<"core">>>;

export default function NearbyPage() {
  const mapDivRef     = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<google.maps.Map | null>(null);
  const markersRef    = useRef<Map<number, google.maps.Marker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // importLibrary로 가져온 클래스 보관
  const MarkerClassRef     = useRef<MarkerLib["Marker"] | null>(null);
  const SizeClassRef       = useRef<CoreLib["Size"] | null>(null);
  const PointClassRef      = useRef<CoreLib["Point"] | null>(null);

  const [checked,    setChecked]    = useState<Set<Category>>(new Set(ALL_CATEGORIES));
  const [userLoc,    setUserLoc]    = useState<{ lat: number; lng: number } | null>(null);
  const [selected,   setSelected]   = useState<NearbyPlace | null>(null);
  const [distance,   setDistance]   = useState<number | null>(null);
  const [mapReady,   setMapReady]   = useState(false);
  const [noKey,      setNoKey]      = useState(false);
  const [sidebarOpen,setSidebarOpen]= useState(true);
  const [locError,   setLocError]   = useState(false);

  /* ── 1. importLibrary 방식으로 로드 + 지도 초기화 (한 번만) ── */
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      setNoKey(true);
      return;
    }

    const init = async () => {
      setOptions({ key: apiKey, language: "ko" });

      // importLibrary 방식으로 필요한 라이브러리만 개별 로드
      const mapsLib   = await importLibrary("maps")   as MapsLib;
      const markerLib = await importLibrary("marker") as MarkerLib;
      const coreLib   = await importLibrary("core")   as CoreLib;

      // 클래스 ref에 저장 (이후 효과에서 google.maps.* 전역 없이 사용)
      MarkerClassRef.current = markerLib.Marker;
      SizeClassRef.current   = coreLib.Size;
      PointClassRef.current  = coreLib.Point;

      if (!mapDivRef.current) return;

      const map = new mapsLib.Map(mapDivRef.current, {
        center: HCM_CENTER,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });

      mapRef.current        = map;
      infoWindowRef.current = new mapsLib.InfoWindow();

      map.addListener("click", () => {
        setSelected(null);
        setDistance(null);
        infoWindowRef.current?.close();
      });

      setMapReady(true);
    };

    init().catch(console.error);
  }, []);

  /* ── 2. 내 위치 획득 ── */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLocError(true);
        setUserLoc(HCM_CENTER);
      },
      { timeout: 8000 }
    );
  }, []);

  /* ── 3. 내 위치 파란 점 마커 ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userLoc) return;
    const Marker = MarkerClassRef.current!;
    const Size   = SizeClassRef.current!;
    const Point  = PointClassRef.current!;

    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = new Marker({
      position: userLoc,
      map: mapRef.current,
      icon: {
        url: makeUserDot(),
        scaledSize: new Size(24, 24),
        anchor:     new Point(12, 12),
      },
      title:  "내 위치",
      zIndex: 999,
    });

    if (!locError) mapRef.current.setCenter(userLoc);
  }, [userLoc, mapReady, locError]);

  /* ── 4. 마커 클릭 핸들러 ── */
  const handleMarkerClick = useCallback(
    (place: NearbyPlace, marker: google.maps.Marker) => {
      setSelected(place);
      if (userLoc) {
        setDistance(haversineKm(userLoc.lat, userLoc.lng, place.lat, place.lng));
      }
      infoWindowRef.current?.setContent(`
        <div style="padding:4px 2px;min-width:160px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${place.name}</div>
          <div style="font-size:12px;color:#555">${place.district} · ${place.address}</div>
          ${place.phone ? `<div style="font-size:12px;color:#1d4ed8;margin-top:4px">${place.phone}</div>` : ""}
        </div>
      `);
      infoWindowRef.current?.open(mapRef.current, marker);
    },
    [userLoc]
  );

  /* ── 5. 카테고리 체크박스에 따른 마커 표시/숨김 ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || !MarkerClassRef.current) return;
    const Marker = MarkerClassRef.current;
    const Size   = SizeClassRef.current!;
    const Point  = PointClassRef.current!;

    nearbyPlaces.forEach((place) => {
      const isChecked = checked.has(place.category);

      if (isChecked && !markersRef.current.has(place.id)) {
        const marker = new Marker({
          position: { lat: place.lat, lng: place.lng },
          map:   mapRef.current!,
          title: place.name,
          icon: {
            url:        makeSvgMarker(markerColors[place.category], categoryIcons[place.category]),
            scaledSize: new Size(40, 52),
            anchor:     new Point(20, 52),
          },
        });
        marker.addListener("click", () => handleMarkerClick(place, marker));
        markersRef.current.set(place.id, marker);
      } else if (!isChecked && markersRef.current.has(place.id)) {
        markersRef.current.get(place.id)!.setMap(null);
        markersRef.current.delete(place.id);
        if (selected?.id === place.id) {
          setSelected(null);
          setDistance(null);
          infoWindowRef.current?.close();
        }
      }
    });
  }, [checked, mapReady, handleMarkerClick, selected]);

  /* ── 체크박스 토글 ── */
  const toggleCategory = (cat: Category) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleAll = () =>
    setChecked((prev) =>
      prev.size === ALL_CATEGORIES.length ? new Set() : new Set(ALL_CATEGORIES)
    );

  const visiblePlaces = nearbyPlaces.filter((p) => checked.has(p.category));

  /* ── 사이드바 업체 클릭 → 지도 이동 ── */
  const flyTo = (place: NearbyPlace) => {
    mapRef.current?.panTo({ lat: place.lat, lng: place.lng });
    mapRef.current?.setZoom(15);
    const marker = markersRef.current.get(place.id);
    if (marker) handleMarkerClick(place, marker);
  };

  /* ── 공통: 업소 목록 아이템 ── */
  const PlaceList = () => (
    <div className="p-3 space-y-1">
      {visiblePlaces.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">선택된 카테고리가 없습니다</p>
      ) : (
        visiblePlaces.map((place) => (
          <button
            key={place.id}
            onClick={() => flyTo(place)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
              selected?.id === place.id
                ? "bg-red-50 border border-red-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ backgroundColor: markerColors[place.category] + "22", color: markerColors[place.category] }}
              >
                {categoryIcons[place.category]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{place.name}</p>
                <p className="text-gray-400 truncate">{place.district} · {place.address}</p>
              </div>
            </div>
            {selected?.id === place.id && distance !== null && (
              <div className="mt-1.5 ml-8 text-red-600 font-semibold">
                📏 {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );

  /* ── 렌더 ── */
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 116px)" }}>
      {noKey && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Google Maps API 키가 필요합니다.{" "}
            <code className="bg-yellow-100 px-1 rounded">.env.local</code>에{" "}
            <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>를 설정해주세요.
          </span>
        </div>
      )}
      {locError && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700 flex items-center gap-2">
          <span>📍</span>
          <span>위치 권한이 거부되어 호치민 중심으로 표시됩니다.</span>
        </div>
      )}

      {/* ══ 공통 컨테이너: 모바일=세로분할, 데스크탑=가로분할 ══ */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* ── 데스크탑 사이드바 (md 이상에서만 표시) ── */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0 ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
        >
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="font-bold text-gray-900 text-sm mb-3">📍 카테고리 필터</h2>
            <label className="flex items-center gap-2 cursor-pointer mb-3 pb-2 border-b border-gray-100">
              <input
                type="checkbox"
                checked={checked.size === ALL_CATEGORIES.length}
                onChange={toggleAll}
                className="w-4 h-4 accent-red-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-700">전체 선택</span>
              <span className="ml-auto text-xs text-gray-400">{visiblePlaces.length}곳</span>
            </label>
            <div className="space-y-2">
              {ALL_CATEGORIES.map((cat) => {
                const count = nearbyPlaces.filter((p) => p.category === cat).length;
                return (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked.has(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: markerColors[cat] }}
                    />
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: markerColors[cat] }} />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {categoryIcons[cat]} {categoryLabels[cat]}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PlaceList />
          </div>
        </aside>

        {/* ── 지도 + 모바일 하단 패널을 감싸는 영역 ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* 지도: 모바일=60% 고정, 데스크탑=flex-1로 나머지 채움 */}
          <div className="relative flex-none h-[60%] md:flex-1 md:h-auto">
            {/* 데스크탑 사이드바 토글 버튼 */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden md:flex absolute top-3 left-3 z-10 bg-white border border-gray-200 shadow rounded-lg w-8 h-8 items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>

            <div ref={mapDivRef} className="w-full h-full" />

            {noKey && (
              <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-4 px-6">
                <div className="text-5xl md:text-6xl">🗺️</div>
                <div className="text-center">
                  <p className="font-bold text-gray-700 text-base md:text-lg">Google Maps API 키 필요</p>
                  <p className="text-xs text-gray-500 mt-1">.env.local에 API 키를 입력하세요</p>
                  <code className="hidden md:block mt-3 bg-white border border-gray-200 rounded-lg px-4 py-2 text-xs">
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=여기에_키_입력
                  </code>
                </div>
              </div>
            )}

            {/* 데스크탑 선택 업소 오버레이 */}
            {selected && (
              <div className="hidden md:flex absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-5 py-3 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: markerColors[selected.category] + "22" }}
                  >
                    {categoryIcons[selected.category]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{selected.name}</p>
                    <p className="text-xs text-gray-500">{selected.district} · {selected.address}</p>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="text-xs text-blue-600 hover:underline">
                        {selected.phone}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {distance !== null ? (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">내 위치와의 직선거리</p>
                      <p className="font-bold text-red-600 text-lg">
                        {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">위치 권한을 허용하면 거리가 표시됩니다</p>
                  )}
                  <button
                    onClick={() => { setSelected(null); setDistance(null); infoWindowRef.current?.close(); }}
                    className="text-gray-400 hover:text-gray-600 text-lg p-1"
                  >✕</button>
                </div>
              </div>
            )}
          </div>

          {/* ── 모바일 하단 패널 40% (md 이상에서 숨김) ── */}
          <div className="flex md:hidden flex-col flex-none bg-white border-t border-gray-200 overflow-hidden" style={{ height: "40%" }}>
            {/* 선택된 업소 정보 */}
            {selected && (
              <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border-b border-red-100 flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: markerColors[selected.category] + "33" }}
                >
                  {categoryIcons[selected.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{selected.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 truncate">{selected.district} · {selected.address}</p>
                    {distance !== null && (
                      <span className="text-xs font-bold text-red-600 flex-shrink-0">
                        {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
                      </span>
                    )}
                  </div>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="text-xs text-blue-600">
                      {selected.phone}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => { setSelected(null); setDistance(null); infoWindowRef.current?.close(); }}
                  className="text-gray-400 text-lg p-1 flex-shrink-0"
                >✕</button>
              </div>
            )}

            {/* 카테고리 필터 칩 (가로 스크롤) */}
            <div className="flex-shrink-0 border-b border-gray-100 px-3 py-2">
              <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <button
                  onClick={toggleAll}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    checked.size === ALL_CATEGORIES.length
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  전체 {visiblePlaces.length}
                </button>
                {ALL_CATEGORIES.map((cat) => {
                  const isOn = checked.has(cat);
                  const count = nearbyPlaces.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isOn ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-300"
                      }`}
                      style={isOn ? { backgroundColor: markerColors[cat] } : {}}
                    >
                      {categoryIcons[cat]} {categoryLabels[cat]}
                      <span className={`ml-0.5 ${isOn ? "opacity-75" : "text-gray-400"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 업소 목록 */}
            <div className="flex-1 overflow-y-auto">
              <PlaceList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
