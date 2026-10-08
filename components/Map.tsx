'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Academy, FavoriteItem, RouteResult } from '@/types/academy';

interface MapProps {
  academies: Academy[];
  favorites: FavoriteItem[];
  selectedAcademy: Academy | null;
  userCoords: [number, number] | null;
  departureCoords?: [number, number] | null;
  center: [number, number];
  zoom: number;
  activeRoute: RouteResult | null;
  onSelectAcademy: (academy: Academy) => void;
  onFindRoute: (academy: Academy) => void;
  onToggleFavorite: (academy: Academy) => void;
  onMapClick?: (coords: [number, number]) => void;
}

// Client-only dynamic loading to avoid SSR window errors
const DynamicMapInner = dynamic(() => import('@/components/MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-xs font-medium">지도를 불러오는 중입니다...</span>
    </div>
  ),
});

export default function Map(props: MapProps) {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <DynamicMapInner {...props} />
    </div>
  );
}
