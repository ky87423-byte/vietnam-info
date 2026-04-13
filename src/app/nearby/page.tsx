"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import {
  nearbyPlaces, markerColors, categoryIcons, categoryLabels,
  NearbyPlace, Category,
} from "@/lib/mockData";

const HCM_CENTER = { lat: 10.7769, lng: 106.7009 };
const ALL_CATEGORIES: Category[] = ["food", "golf", "hotel", "rent", "exchange", "etc"];

/* ── 라이브러리 타입 ── */
type MapsLib   = Awaited<ReturnType<typeof importLibrary<"maps">>>;
type MarkerLib = Awaited<ReturnType<typeof importLibrary<"marker">>>;
type CoreLib   = Awaited<ReturnType<typeof importLibrary<"core">>>;

/* ── 맛집 타입 ── */
type CuisineKey = "local" | "korean" | "italian" | "indian" | "japanese";

const CUISINES: { key: CuisineKey; label: string; query: string; icon: string; color: string }[] = [
  { key: "local",    label: "로컬음식",   query: "local Vietnamese food restaurant Ho Chi Minh",  icon: "🍜", color: "#f59e0b" },
  { key: "korean",   label: "한국음식점", query: "Korean restaurant 한식 Ho Chi Minh",              icon: "🍚", color: "#ef4444" },
  { key: "italian",  label: "이탈리아",   query: "Italian restaurant pizza Ho Chi Minh",          icon: "🍝", color: "#10b981" },
  { key: "indian",   label: "인도음식",   query: "Indian restaurant curry Ho Chi Minh",           icon: "🍛", color: "#f97316" },
  { key: "japanese", label: "일본음식",   query: "Japanese restaurant sushi ramen Ho Chi Minh",   icon: "🍱", color: "#8b5cf6" },
];

const cuisineMap = Object.fromEntries(CUISINES.map((c) => [c.key, c])) as Record<CuisineKey, typeof CUISINES[0]>;

interface Restaurant {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  cuisine: CuisineKey;
}

type SelectedItem =
  | { kind: "place";      data: NearbyPlace }
  | { kind: "restaurant"; data: Restaurant };

/* ── 유틸 함수 ── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeSvgMarker(color: string, emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
    <path d="M20 0C8.954 0 0 8.954 0 20c0 13.5 20 32 20 32S40 33.5 40 20C40 8.954 31.046 0 20 0z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="20" cy="20" r="13" fill="white" opacity="0.95"/>
    <text x="20" y="26" text-anchor="middle" font-size="15">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeRestaurantMarker(color: string, emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="15" fill="${color}" stroke="white" stroke-width="2.5"/>
    <text x="17" y="23" text-anchor="middle" font-size="14">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeUserDot() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#4285F4" opacity="0.25"/>
    <circle cx="12" cy="12" r="6" fill="#4285F4" stroke="white" stroke-width="2"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderStars(rating: number) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

/* ══════════════════════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════════════════════ */
export default function NearbyPage() {
  /* ── refs ── */
  const mapDivRef           = useRef<HTMLDivElement>(null);
  const mapRef              = useRef<google.maps.Map | null>(null);
  const markersRef          = useRef<Map<number, google.maps.Marker>>(new Map());
  const restaurantMarkersRef= useRef<Map<string, google.maps.Marker>>(new Map());
  const userMarkerRef       = useRef<google.maps.Marker | null>(null);
  const infoWindowRef       = useRef<google.maps.InfoWindow | null>(null);
  const MarkerClassRef      = useRef<MarkerLib["Marker"] | null>(null);
  const SizeClassRef        = useRef<CoreLib["Size"] | null>(null);
  const PointClassRef       = useRef<CoreLib["Point"] | null>(null);
  const PlacesServiceRef    = useRef<google.maps.places.PlacesService | null>(null);
  const restaurantsFetched  = useRef(false);

  /* ── state ── */
  const [checked,         setChecked]         = useState<Set<Category>>(new Set(ALL_CATEGORIES));
  const [checkedCuisines, setCheckedCuisines] = useState<Set<CuisineKey>>(new Set(CUISINES.map(c => c.key)));
  const [userLoc,         setUserLoc]         = useState<{ lat: number; lng: number } | null>(null);
  const [selected,        setSelected]        = useState<SelectedItem | null>(null);
  const [distance,        setDistance]        = useState<number | null>(null);
  const [mapReady,        setMapReady]        = useState(false);
  const [noKey,           setNoKey]           = useState(false);
  const [sidebarOpen,     setSidebarOpen]     = useState(true);
  const [sidebarTab,      setSidebarTab]      = useState<"places" | "restaurants">("places");
  const [locError,        setLocError]        = useState(false);
  const [restaurants,     setRestaurants]     = useState<Restaurant[]>([]);
  const [placesLoading,   setPlacesLoading]   = useState(false);
  const [placesError,     setPlacesError]     = useState(false);

  /* ── 1. 지도 초기화 ── */
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      setNoKey(true);
      return;
    }

    const init = async () => {
      setOptions({ key: apiKey, language: "ko" });

      const mapsLib   = await importLibrary("maps")   as MapsLib;
      const markerLib = await importLibrary("marker") as MarkerLib;
      const coreLib   = await importLibrary("core")   as CoreLib;

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

      /* Places 서비스 초기화 */
      const placesLib = await importLibrary("places") as {
        PlacesService: new(a: google.maps.Map) => google.maps.places.PlacesService;
      };
      PlacesServiceRef.current = new placesLib.PlacesService(map);

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
      () => { setLocError(true); setUserLoc(HCM_CENTER); },
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
      icon: { url: makeUserDot(), scaledSize: new Size(24, 24), anchor: new Point(12, 12) },
      title: "내 위치",
      zIndex: 999,
    });
    if (!locError) mapRef.current.setCenter(userLoc);
  }, [userLoc, mapReady, locError]);

  /* ── 4. mockData 마커 클릭 핸들러 ── */
  const handlePlaceClick = useCallback((place: NearbyPlace, marker: google.maps.Marker) => {
    setSelected({ kind: "place", data: place });
    if (userLoc) setDistance(haversineKm(userLoc.lat, userLoc.lng, place.lat, place.lng));
    infoWindowRef.current?.setContent(`
      <div style="padding:4px 2px;min-width:160px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${place.name}</div>
        <div style="font-size:12px;color:#555">${place.district} · ${place.address}</div>
        ${place.phone ? `<div style="font-size:12px;color:#1d4ed8;margin-top:4px">${place.phone}</div>` : ""}
      </div>`);
    infoWindowRef.current?.open(mapRef.current, marker);
  }, [userLoc]);

  /* ── 5. 맛집 마커 클릭 핸들러 ── */
  const handleRestaurantClick = useCallback((r: Restaurant, marker: google.maps.Marker) => {
    setSelected({ kind: "restaurant", data: r });
    if (userLoc) setDistance(haversineKm(userLoc.lat, userLoc.lng, r.lat, r.lng));
    const cuisine = cuisineMap[r.cuisine];
    infoWindowRef.current?.setContent(`
      <div style="padding:4px 2px;min-width:180px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${r.name}</div>
        ${r.rating ? `<div style="font-size:12px;color:#f59e0b;margin-bottom:2px">★ ${r.rating.toFixed(1)} <span style="color:#888">(${r.userRatingsTotal ?? 0})</span></div>` : ""}
        <div style="font-size:11px;color:#555">${r.address}</div>
        <div style="font-size:11px;color:${cuisine.color};margin-top:4px;font-weight:600">${cuisine.icon} ${cuisine.label}</div>
      </div>`);
    infoWindowRef.current?.open(mapRef.current, marker);
  }, [userLoc]);

  /* ── 6. mockData 카테고리 마커 ── */
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
          map: mapRef.current!,
          title: place.name,
          icon: {
            url: makeSvgMarker(markerColors[place.category], categoryIcons[place.category]),
            scaledSize: new Size(40, 52),
            anchor: new Point(20, 52),
          },
        });
        marker.addListener("click", () => handlePlaceClick(place, marker));
        markersRef.current.set(place.id, marker);
      } else if (!isChecked && markersRef.current.has(place.id)) {
        markersRef.current.get(place.id)!.setMap(null);
        markersRef.current.delete(place.id);
        if (selected?.kind === "place" && selected.data.id === place.id) {
          setSelected(null); setDistance(null); infoWindowRef.current?.close();
        }
      }
    });
  }, [checked, mapReady, handlePlaceClick, selected]);

  /* ── 7. 맛집 마커 표시/숨김 ── */
  useEffect(() => {
    if (!mapReady || !MarkerClassRef.current) return;
    const Marker = MarkerClassRef.current;
    const Size   = SizeClassRef.current!;
    const Point  = PointClassRef.current!;

    restaurants.forEach((r) => {
      const isOn = checkedCuisines.has(r.cuisine);
      if (isOn && !restaurantMarkersRef.current.has(r.placeId)) {
        const cuisine = cuisineMap[r.cuisine];
        const marker = new Marker({
          position: { lat: r.lat, lng: r.lng },
          map: mapRef.current!,
          title: r.name,
          icon: {
            url: makeRestaurantMarker(cuisine.color, cuisine.icon),
            scaledSize: new Size(34, 34),
            anchor: new Point(17, 17),
          },
          zIndex: 10,
        });
        marker.addListener("click", () => handleRestaurantClick(r, marker));
        restaurantMarkersRef.current.set(r.placeId, marker);
      } else if (!isOn && restaurantMarkersRef.current.has(r.placeId)) {
        restaurantMarkersRef.current.get(r.placeId)!.setMap(null);
        restaurantMarkersRef.current.delete(r.placeId);
        if (selected?.kind === "restaurant" && selected.data.placeId === r.placeId) {
          setSelected(null); setDistance(null); infoWindowRef.current?.close();
        }
      }
    });
  }, [restaurants, checkedCuisines, mapReady, handleRestaurantClick, selected]);

  /* ── 8. 맛집 탭 → Places API 검색 (한 번만) ── */
  useEffect(() => {
    if (sidebarTab !== "restaurants" || !mapReady || restaurantsFetched.current) return;
    if (!PlacesServiceRef.current) return;

    restaurantsFetched.current = true;
    setPlacesLoading(true);
    setPlacesError(false);

    const service = PlacesServiceRef.current;

    const searchOne = (cuisine: typeof CUISINES[0]): Promise<Restaurant[]> =>
      new Promise((resolve) => {
        service.textSearch(
          { query: `${cuisine.query}`, location: HCM_CENTER, radius: 8000 },
          (results, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
              resolve([]);
              return;
            }
            resolve(
              results.slice(0, 10).map((r) => ({
                placeId: r.place_id ?? `${cuisine.key}-${Math.random()}`,
                name: r.name ?? "",
                lat: r.geometry?.location?.lat() ?? 0,
                lng: r.geometry?.location?.lng() ?? 0,
                address: r.formatted_address ?? r.vicinity ?? "",
                rating: r.rating,
                userRatingsTotal: r.user_ratings_total,
                cuisine: cuisine.key,
              }))
            );
          }
        );
      });

    Promise.all(CUISINES.map(searchOne))
      .then((results) => {
        const all = results.flat();
        setRestaurants(all);
        if (all.length === 0) setPlacesError(true);
      })
      .catch(() => setPlacesError(true))
      .finally(() => setPlacesLoading(false));
  }, [sidebarTab, mapReady]);

  /* ── 필터 토글 ── */
  const toggleCategory = (cat: Category) =>
    setChecked((prev) => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  const toggleAll = () =>
    setChecked((prev) => prev.size === ALL_CATEGORIES.length ? new Set() : new Set(ALL_CATEGORIES));

  const toggleCuisine = (key: CuisineKey) =>
    setCheckedCuisines((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const toggleAllCuisines = () =>
    setCheckedCuisines((prev) => prev.size === CUISINES.length ? new Set() : new Set(CUISINES.map(c => c.key)));

  /* ── 지도 이동 ── */
  const flyToPlace = (place: NearbyPlace) => {
    mapRef.current?.panTo({ lat: place.lat, lng: place.lng });
    mapRef.current?.setZoom(15);
    const marker = markersRef.current.get(place.id);
    if (marker) handlePlaceClick(place, marker);
  };

  const flyToRestaurant = (r: Restaurant) => {
    mapRef.current?.panTo({ lat: r.lat, lng: r.lng });
    mapRef.current?.setZoom(16);
    const marker = restaurantMarkersRef.current.get(r.placeId);
    if (marker) handleRestaurantClick(r, marker);
  };

  /* ── 파생 데이터 ── */
  const visiblePlaces      = nearbyPlaces.filter((p) => checked.has(p.category));
  const visibleRestaurants = restaurants.filter((r) => checkedCuisines.has(r.cuisine));

  /* ══════════ 사이드바 컨텐츠 ══════════ */

  /* 업소 필터 패널 */
  const PlacesFilter = () => (
    <div className="p-4 border-b border-gray-100 flex-shrink-0">
      <label className="flex items-center gap-2 cursor-pointer mb-3 pb-2 border-b border-gray-100">
        <input type="checkbox" checked={checked.size === ALL_CATEGORIES.length} onChange={toggleAll}
          className="w-4 h-4 accent-red-600 cursor-pointer" />
        <span className="text-sm font-semibold text-gray-700">전체 선택</span>
        <span className="ml-auto text-xs text-gray-400">{visiblePlaces.length}곳</span>
      </label>
      <div className="space-y-2">
        {ALL_CATEGORIES.map((cat) => {
          const count = nearbyPlaces.filter((p) => p.category === cat).length;
          return (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={checked.has(cat)} onChange={() => toggleCategory(cat)}
                className="w-4 h-4 cursor-pointer" style={{ accentColor: markerColors[cat] }} />
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
  );

  /* 업소 목록 */
  const PlaceList = () => (
    <div className="p-3 space-y-1">
      {visiblePlaces.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">선택된 카테고리가 없습니다</p>
      ) : (
        visiblePlaces.map((place) => (
          <button key={place.id} onClick={() => flyToPlace(place)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
              selected?.kind === "place" && selected.data.id === place.id
                ? "bg-red-50 border border-red-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ backgroundColor: markerColors[place.category] + "22", color: markerColors[place.category] }}>
                {categoryIcons[place.category]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{place.name}</p>
                <p className="text-gray-400 truncate">{place.district} · {place.address}</p>
              </div>
            </div>
            {selected?.kind === "place" && selected.data.id === place.id && distance !== null && (
              <div className="mt-1.5 ml-8 text-red-600 font-semibold">
                📏 {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );

  /* 맛집 필터 패널 */
  const RestaurantsFilter = () => (
    <div className="p-4 border-b border-gray-100 flex-shrink-0">
      <label className="flex items-center gap-2 cursor-pointer mb-3 pb-2 border-b border-gray-100">
        <input type="checkbox" checked={checkedCuisines.size === CUISINES.length} onChange={toggleAllCuisines}
          className="w-4 h-4 accent-red-600 cursor-pointer" />
        <span className="text-sm font-semibold text-gray-700">전체 선택</span>
        <span className="ml-auto text-xs text-gray-400">{visibleRestaurants.length}곳</span>
      </label>
      <div className="space-y-2">
        {CUISINES.map((c) => {
          const count = restaurants.filter((r) => r.cuisine === c.key).length;
          return (
            <label key={c.key} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={checkedCuisines.has(c.key)} onChange={() => toggleCuisine(c.key)}
                className="w-4 h-4 cursor-pointer" style={{ accentColor: c.color }} />
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{c.icon} {c.label}</span>
              <span className="ml-auto text-xs text-gray-400">{count}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  /* 맛집 목록 */
  const RestaurantList = () => {
    if (placesLoading) return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
        <div className="w-6 h-6 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
        <p className="text-xs">맛집 검색 중...</p>
      </div>
    );
    if (placesError) return (
      <div className="p-4 text-center text-xs text-gray-400">
        <p className="text-2xl mb-2">😥</p>
        <p>맛집 정보를 불러오지 못했습니다.</p>
        <p className="mt-1 text-gray-300">API 키를 확인해주세요.</p>
      </div>
    );
    if (visibleRestaurants.length === 0 && !placesLoading) return (
      <div className="p-4 text-center text-xs text-gray-400 py-8">선택된 음식 카테고리가 없습니다</div>
    );
    return (
      <div className="p-3 space-y-1">
        {visibleRestaurants.map((r) => {
          const c = cuisineMap[r.cuisine];
          const isSelected = selected?.kind === "restaurant" && selected.data.placeId === r.placeId;
          return (
            <button key={r.placeId} onClick={() => flyToRestaurant(r)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                isSelected ? "bg-red-50 border border-red-200" : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ backgroundColor: c.color + "22", color: c.color }}>
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate">{r.name}</p>
                  <p className="text-gray-400 truncate">{r.address}</p>
                  {r.rating && (
                    <p className="text-yellow-500 font-medium">
                      {renderStars(r.rating)} {r.rating.toFixed(1)}
                      {r.userRatingsTotal && <span className="text-gray-400 font-normal"> ({r.userRatingsTotal})</span>}
                    </p>
                  )}
                </div>
              </div>
              {isSelected && distance !== null && (
                <div className="mt-1.5 ml-8 text-red-600 font-semibold">
                  📏 {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  /* ── 선택 아이템 정보 (하단 오버레이용) ── */
  const selectedIcon  = selected?.kind === "place"
    ? categoryIcons[selected.data.category]
    : selected ? cuisineMap[selected.data.cuisine].icon : "";
  const selectedColor = selected?.kind === "place"
    ? markerColors[selected.data.category]
    : selected ? cuisineMap[selected.data.cuisine].color : "#888";
  const selectedName    = selected?.data.name ?? "";
  const selectedSub     = selected?.kind === "place"
    ? `${selected.data.district} · ${selected.data.address}`
    : selected?.data.address ?? "";
  const selectedPhone   = selected?.kind === "place" ? selected.data.phone : undefined;
  const selectedRating  = selected?.kind === "restaurant" ? selected.data.rating : undefined;
  const selectedTotal   = selected?.kind === "restaurant" ? selected.data.userRatingsTotal : undefined;

  /* ══════════════════════════════════════
     렌더
  ══════════════════════════════════════ */
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 116px)" }}>
      {noKey && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>Google Maps API 키가 필요합니다.{" "}
            <code className="bg-yellow-100 px-1 rounded">.env.local</code>에{" "}
            <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>를 설정해주세요.
          </span>
        </div>
      )}
      {locError && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700 flex items-center gap-2">
          <span>📍</span><span>위치 권한이 거부되어 호치민 중심으로 표시됩니다.</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* ── 데스크탑 사이드바 ── */}
        <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0 ${
          sidebarOpen ? "w-72" : "w-0"
        }`}>
          {/* 탭 */}
          <div className="flex border-b border-gray-200 flex-shrink-0">
            <button onClick={() => setSidebarTab("places")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                sidebarTab === "places" ? "text-red-700 border-b-2 border-red-700 bg-red-50" : "text-gray-500 hover:text-gray-700"
              }`}>
              🏪 업소
            </button>
            <button onClick={() => setSidebarTab("restaurants")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                sidebarTab === "restaurants" ? "text-red-700 border-b-2 border-red-700 bg-red-50" : "text-gray-500 hover:text-gray-700"
              }`}>
              🍽️ 맛집
              {restaurants.length > 0 && (
                <span className="ml-1 text-gray-400 font-normal">({restaurants.length})</span>
              )}
            </button>
          </div>

          {sidebarTab === "places" ? (
            <>
              <PlacesFilter />
              <div className="flex-1 overflow-y-auto"><PlaceList /></div>
            </>
          ) : (
            <>
              {!placesLoading && <RestaurantsFilter />}
              <div className="flex-1 overflow-y-auto"><RestaurantList /></div>
            </>
          )}
        </aside>

        {/* ── 지도 영역 ── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="relative flex-none h-[60%] md:flex-1 md:h-auto">
            <button onClick={() => setSidebarOpen((v) => !v)}
              className="hidden md:flex absolute top-3 left-3 z-10 bg-white border border-gray-200 shadow rounded-lg w-8 h-8 items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
              {sidebarOpen ? "◀" : "▶"}
            </button>

            <div ref={mapDivRef} className="w-full h-full" />

            {noKey && (
              <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-4 px-6">
                <div className="text-5xl md:text-6xl">🗺️</div>
                <div className="text-center">
                  <p className="font-bold text-gray-700 text-base md:text-lg">Google Maps API 키 필요</p>
                  <p className="text-xs text-gray-500 mt-1">.env.local에 API 키를 입력하세요</p>
                </div>
              </div>
            )}

            {/* 데스크탑 선택 오버레이 */}
            {selected && (
              <div className="hidden md:flex absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-5 py-3 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: selectedColor + "22" }}>
                    {selectedIcon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{selectedName}</p>
                    <p className="text-xs text-gray-500">{selectedSub}</p>
                    {selectedRating && (
                      <p className="text-xs text-yellow-500 font-medium">
                        ★ {selectedRating.toFixed(1)}
                        {selectedTotal && <span className="text-gray-400 font-normal"> ({selectedTotal})</span>}
                      </p>
                    )}
                    {selectedPhone && (
                      <a href={`tel:${selectedPhone}`} className="text-xs text-blue-600 hover:underline">{selectedPhone}</a>
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
                  <button onClick={() => { setSelected(null); setDistance(null); infoWindowRef.current?.close(); }}
                    className="text-gray-400 hover:text-gray-600 text-lg p-1">✕</button>
                </div>
              </div>
            )}
          </div>

          {/* ── 모바일 하단 패널 ── */}
          <div className="flex md:hidden flex-col flex-none bg-white border-t border-gray-200 overflow-hidden" style={{ height: "40%" }}>
            {/* 선택된 업소/맛집 정보 */}
            {selected && (
              <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border-b border-red-100 flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: selectedColor + "33" }}>
                  {selectedIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{selectedName}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 truncate">{selectedSub}</p>
                    {distance !== null && (
                      <span className="text-xs font-bold text-red-600 flex-shrink-0">
                        {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
                      </span>
                    )}
                  </div>
                  {selectedRating && (
                    <p className="text-xs text-yellow-500">★ {selectedRating.toFixed(1)}
                      {selectedTotal && <span className="text-gray-400"> ({selectedTotal})</span>}
                    </p>
                  )}
                  {selectedPhone && (
                    <a href={`tel:${selectedPhone}`} className="text-xs text-blue-600">{selectedPhone}</a>
                  )}
                </div>
                <button onClick={() => { setSelected(null); setDistance(null); infoWindowRef.current?.close(); }}
                  className="text-gray-400 text-lg p-1 flex-shrink-0">✕</button>
              </div>
            )}

            {/* 모바일 탭 */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              <button onClick={() => setSidebarTab("places")}
                className={`flex-1 py-1.5 text-xs font-semibold ${sidebarTab === "places" ? "text-red-700 border-b-2 border-red-700" : "text-gray-500"}`}>
                🏪 업소
              </button>
              <button onClick={() => setSidebarTab("restaurants")}
                className={`flex-1 py-1.5 text-xs font-semibold ${sidebarTab === "restaurants" ? "text-red-700 border-b-2 border-red-700" : "text-gray-500"}`}>
                🍽️ 맛집 {restaurants.length > 0 && `(${restaurants.length})`}
              </button>
            </div>

            {/* 모바일 필터 칩 */}
            <div className="flex-shrink-0 border-b border-gray-100 px-3 py-2">
              <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {sidebarTab === "places" ? (
                  <>
                    <button onClick={toggleAll}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        checked.size === ALL_CATEGORIES.length ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"
                      }`}>
                      전체 {visiblePlaces.length}
                    </button>
                    {ALL_CATEGORIES.map((cat) => {
                      const isOn = checked.has(cat);
                      return (
                        <button key={cat} onClick={() => toggleCategory(cat)}
                          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            isOn ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-300"
                          }`}
                          style={isOn ? { backgroundColor: markerColors[cat] } : {}}>
                          {categoryIcons[cat]} {categoryLabels[cat]}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <button onClick={toggleAllCuisines}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        checkedCuisines.size === CUISINES.length ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"
                      }`}>
                      전체 {visibleRestaurants.length}
                    </button>
                    {CUISINES.map((c) => {
                      const isOn = checkedCuisines.has(c.key);
                      return (
                        <button key={c.key} onClick={() => toggleCuisine(c.key)}
                          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            isOn ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-300"
                          }`}
                          style={isOn ? { backgroundColor: c.color } : {}}>
                          {c.icon} {c.label}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* 모바일 목록 */}
            <div className="flex-1 overflow-y-auto">
              {sidebarTab === "places" ? <PlaceList /> : <RestaurantList />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
