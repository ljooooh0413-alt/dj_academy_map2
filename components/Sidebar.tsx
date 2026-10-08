'use client';

import React, { useState } from 'react';
import { Academy, FavoriteItem } from '@/types/academy';
import { Star, Navigation, Phone, ChevronRight, Layers, AlertCircle, Search } from 'lucide-react';

interface SidebarProps {
  academies: Academy[];
  favorites: FavoriteItem[];
  selectedAcademyId: string | null;
  onSelectAcademy: (academy: Academy) => void;
  onFindRoute: (academy: Academy) => void;
  onToggleFavorite: (academy: Academy) => void;
  activeTab: 'all' | 'favorites';
  onTabChange: (tab: 'all' | 'favorites') => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  userCoords: [number, number] | null; // [lat, lng]
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

// Calculate straight distance in km for badge
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

const CATEGORIES = [
  { id: '전체', label: '전체' },
  { id: '입시', label: '입시·보습' },
  { id: '외국어', label: '어학·외국어' },
  { id: '예능', label: '음악·미술' },
  { id: '직업', label: '코딩·직업' },
];

export default function Sidebar({
  academies,
  favorites,
  selectedAcademyId,
  onSelectAcademy,
  onFindRoute,
  onToggleFavorite,
  activeTab,
  onTabChange,
  selectedCategory,
  onSelectCategory,
  userCoords,
  isLoading,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Set of favorited academy IDs for quick lookup
  const favIds = new Set(favorites.map((f) => f.academyId));

  // Determine list based on tab
  const displayList = activeTab === 'favorites'
    ? academies.filter((a) => favIds.has(a.id))
    : academies;

  return (
    <aside className="w-full md:w-96 lg:w-[420px] bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] shrink-0 z-20">
      {/* Mobile Search Bar toggle */}
      <div className="p-3 border-b border-slate-100 lg:hidden flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="학원명/과목 검색..."
            className="w-full h-8 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md"
          />
        </div>
      </div>

      {/* Tab Header (Segmented Controls) */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex rounded-lg bg-slate-200/80 p-1">
          <button
            onClick={() => onTabChange('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 학원 ({academies.length})
          </button>
          <button
            onClick={() => onTabChange('favorites')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'favorites'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>즐겨찾기</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full tabular-nums">
              {favorites.length}
            </span>
          </button>
        </div>

        {/* Category Quick Filter */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Academy List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">학원 목록을 불러오는 중입니다...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 mb-1">
              {activeTab === 'favorites' ? '등록된 즐겨찾기가 없습니다' : '검색 결과가 없습니다'}
            </p>
            <p className="text-xs text-slate-400 max-w-[220px]">
              {activeTab === 'favorites'
                ? '학원 카드의 별(★) 아이콘을 눌러 관심 학원을 즐겨찾기에 등록해보세요.'
                : '검색어나 지역 필터를 변경하여 다시 시도해보세요.'}
            </p>
          </div>
        ) : (
          displayList.map((academy) => {
            const isFav = favIds.has(academy.id);
            const isSelected = selectedAcademyId === academy.id;
            const distBadge = userCoords
              ? getDistanceKm(userCoords[0], userCoords[1], academy.lat, academy.lng)
              : null;

            return (
              <div
                key={academy.id}
                onClick={() => onSelectAcademy(academy)}
                className={`p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer group relative ${
                  isSelected ? 'bg-blue-50/60 ring-1 ring-blue-500/30' : ''
                }`}
              >
                {/* Category tag & Distance */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-blue-600 font-semibold">{academy.realmName}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="truncate max-w-[130px]">{academy.courseName}</span>
                  </div>

                  {distBadge && (
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                      {distBadge}
                    </span>
                  )}
                </div>

                {/* Academy Title & Favorite Star */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {academy.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(academy);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-500 transition-colors shrink-0"
                    title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isFav ? 'fill-amber-400 text-amber-500' : 'text-slate-300 hover:text-amber-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Address & Tel */}
                <p className="text-xs text-slate-600 truncate mb-2">
                  {academy.roadAddress}
                </p>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {academy.tuition || academy.tel}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Call button */}
                    {academy.tel && academy.tel !== '전화번호 미제공' && (
                      <a
                        href={`tel:${academy.tel}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
                        title="전화 걸기"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Find Route Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFindRoute(academy);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1 shadow-xs transition-colors"
                      title="이 학원으로 길찾기"
                    >
                      <Navigation className="w-3 h-3 fill-current" />
                      <span>길찾기</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
        <span>총 {displayList.length}개소 안내</span>
        <span>나이스(NEIS) · TMAP 연동</span>
      </div>
    </aside>
  );
}
