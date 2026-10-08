'use client';

import React, { useState } from 'react';
import { RouteResult, TravelMode, Academy } from '@/types/academy';
import { Navigation, Footprints, Car, X, ChevronDown, ChevronUp, ExternalLink, MapPin, Flag, Crosshair } from 'lucide-react';

interface RoutePanelProps {
  route: RouteResult;
  targetAcademy: Academy;
  currentMode: TravelMode;
  onChangeMode: (mode: TravelMode) => void;
  onClose: () => void;
  isLoading: boolean;
  onSetPickDepartureMode?: () => void;
  isPickingDeparture?: boolean;
}

export default function RoutePanel({
  route,
  targetAcademy,
  currentMode,
  onChangeMode,
  onClose,
  isLoading,
  onSetPickDepartureMode,
  isPickingDeparture,
}: RoutePanelProps) {
  const [showSteps, setShowSteps] = useState(true);

  // Format meters to km or m
  const formattedDistance =
    route.distance < 1000 ? `${route.distance}m` : `${(route.distance / 1000).toFixed(2)}km`;

  // Format seconds to minutes / hours
  const minutes = Math.max(1, Math.round(route.duration / 60));
  const formattedTime =
    minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`;

  // Calorie calculation (~ 48 kcal per km walking)
  const calories = Math.round((route.distance / 1000) * 48);

  // External TMAP Deep Link
  const tmapDeepLink = `tmap://route?goalname=${encodeURIComponent(
    targetAcademy.name
  )}&goallat=${targetAcademy.lat}&goallon=${targetAcademy.lng}`;

  return (
    <div className="absolute top-4 right-4 z-30 w-84 md:w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Top Header */}
      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Navigation className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight text-white leading-tight">
              실시간 도로 경로 안내
            </h4>
            <p className="text-[10px] text-slate-300">
              {route.source === 'tmap' ? 'TMAP 실시간 엔진' : '고정밀 도로망 기반'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="경로 안내 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Origin & Destination Display */}
      <div className="p-3 bg-slate-50 border-b border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">
              출
            </div>
            <span className="font-semibold text-slate-800 truncate">
              {route.startName || '지정 출발지'}
            </span>
          </div>

          {onSetPickDepartureMode && (
            <button
              onClick={onSetPickDepartureMode}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border flex items-center gap-1 transition-colors shrink-0 ${
                isPickingDeparture
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="지도에서 원하는 지점을 클릭해 출발지로 설정"
            >
              <Crosshair className="w-3 h-3 text-emerald-600" />
              <span>{isPickingDeparture ? '지도 클릭 중...' : '출발지 변경'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">
            도
          </div>
          <span className="font-bold text-slate-900 truncate">
            {targetAcademy.name}
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="p-2 bg-slate-100 border-b border-slate-200/60 flex items-center justify-center gap-2">
        <button
          onClick={() => onChangeMode('pedestrian')}
          disabled={isLoading}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            currentMode === 'pedestrian'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span>도보 경로</span>
        </button>

        <button
          onClick={() => onChangeMode('car')}
          disabled={isLoading}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            currentMode === 'car'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>차량 경로</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="p-4 bg-white">
        {isLoading ? (
          <div className="py-6 text-center text-slate-500">
            <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-1" />
            <p className="text-xs font-medium">도로망 경로를 계산하는 중입니다...</p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-2xl font-black text-slate-900 tracking-tight mr-1 tabular-nums">
                  {formattedTime}
                </span>
                <span className="text-xs text-slate-500 font-medium">소요</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-800 tabular-nums">
                  {formattedDistance}
                </span>
                <div className="text-[11px] text-slate-500">
                  {currentMode === 'pedestrian' ? `소모 칼로리 약 ${calories} kcal` : '차량 기준 이동'}
                </div>
              </div>
            </div>

            {/* Quality Indicator */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>지도의 실제 도로를 따라 안내 중</span>
              </span>
              <span className="text-emerald-600 font-bold">정상 일치</span>
            </div>
          </>
        )}
      </div>

      {/* Step-by-Step Directions Accordion */}
      {route.steps && route.steps.length > 0 && (
        <div className="border-t border-slate-200/80">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full py-2 px-3.5 bg-slate-50 hover:bg-slate-100/80 text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors"
          >
            <span>도로 구간별 상세 안내 ({route.steps.length}구간)</span>
            {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showSteps && (
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 p-2 text-xs text-slate-600">
              {route.steps.map((step, idx) => (
                <div key={idx} className="py-1.5 px-2 flex items-start gap-2 hover:bg-slate-50 rounded">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-800 leading-tight font-medium">{step.instruction}</p>
                    {step.distance > 0 && (
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {step.distance}m 이동
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation Actions */}
      <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2">
        <a
          href={tmapDeepLink}
          onClick={(e) => {
            if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
              e.preventDefault();
              window.open(`https://map.naver.com/v5/search/${encodeURIComponent(targetAcademy.roadAddress)}`, '_blank');
            }
          }}
          className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>내비게이션 앱으로 보기</span>
        </a>

        <button
          onClick={onClose}
          className="py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
        >
          경로 닫기
        </button>
      </div>
    </div>
  );
}
