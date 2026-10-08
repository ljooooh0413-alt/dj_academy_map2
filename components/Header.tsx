'use client';

import React from 'react';
import Link from 'next/link';
import { REGIONS_DATA } from '@/lib/data/sampleAcademies';
import { Search, MapPin, Star, User, Settings, X } from 'lucide-react';

interface HeaderProps {
  selectedOfcdc: string;
  onSelectOfcdc: (code: string) => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoritesCount: number;
  activeTab: 'all' | 'favorites';
  onTabChange: (tab: 'all' | 'favorites') => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
}

export default function Header({
  selectedOfcdc,
  onSelectOfcdc,
  selectedZone,
  onSelectZone,
  searchQuery,
  onSearchChange,
  favoritesCount,
  activeTab,
  onTabChange,
  userEmail,
  onOpenAuth,
  onOpenSettings,
  onLocateMe,
  isLocating,
}: HeaderProps) {
  const currentRegion = REGIONS_DATA.find((r) => r.code === selectedOfcdc) || REGIONS_DATA[0];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-3 z-30 shrink-0 shadow-xs">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
            E
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              EduMap
            </span>
            <span className="text-[10px] text-slate-500 font-medium">전국 학원·교습소 길안내</span>
          </div>
        </Link>
      </div>

      {/* Zone 2: Navigation controls & Search */}
      <div className="hidden lg:flex items-center gap-2 flex-1 max-w-2xl mx-2">
        {/* Region selector */}
        <div className="relative shrink-0">
          <select
            value={selectedOfcdc}
            onChange={(e) => {
              onSelectOfcdc(e.target.value);
              onSelectZone('전체');
            }}
            className="h-9 text-xs font-medium pl-3 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-colors"
          >
            {REGIONS_DATA.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name.replace('교육청', '')}
              </option>
            ))}
          </select>
        </div>

        {/* Zone (District) selector */}
        <div className="relative shrink-0">
          <select
            value={selectedZone}
            onChange={(e) => onSelectZone(e.target.value)}
            className="h-9 text-xs font-medium pl-3 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-colors"
          >
            {currentRegion.zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>

        {/* Keyword Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="학원명, 과목(수학/영어/코딩), 도로명 검색..."
            className="w-full h-9 pl-9 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="검색어 지우기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Actions & User State */}
      <div className="flex items-center gap-2 shrink-0">
        {/* GPS Locate button */}
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="h-9 px-3 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
          title="현재 위치로 이동"
        >
          <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce text-blue-600' : 'text-slate-600'}`} />
          <span className="hidden sm:inline">{isLocating ? '확인 중...' : '내 위치'}</span>
        </button>

        {/* Favorites shortcut button */}
        <button
          onClick={() => onTabChange(activeTab === 'favorites' ? 'all' : 'favorites')}
          className={`h-9 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap border ${
            activeTab === 'favorites'
              ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="즐겨찾기 모아보기"
        >
          <Star className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
          <span className="hidden sm:inline">즐겨찾기</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 tabular-nums">
            {favoritesCount}
          </span>
        </button>

        {/* Supabase Auth / Profile button */}
        <button
          onClick={onOpenAuth}
          className="h-9 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline max-w-[100px] truncate">
            {userEmail ? userEmail.split('@')[0] : '로그인'}
          </span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="h-9 w-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          title="API 및 연동 설정"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
