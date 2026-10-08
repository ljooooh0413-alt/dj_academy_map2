'use client';

import React, { useState } from 'react';
import { Academy } from '@/types/academy';
import { X, MapPin, Phone, Star, Navigation, Footprints, Car, Copy, Check, ExternalLink } from 'lucide-react';

interface AcademyDetailModalProps {
  academy: Academy | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (academy: Academy) => void;
  onFindRoute: (academy: Academy, mode: 'pedestrian' | 'car') => void;
}

export default function AcademyDetailModal({
  academy,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onFindRoute,
}: AcademyDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !academy) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(academy.roadAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-b from-slate-50 to-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
                {academy.realmName}
              </span>
              <span className="text-xs text-slate-500 font-medium">{academy.courseName}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{academy.name}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-sm text-slate-700">
          {/* Address */}
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-slate-900">{academy.roadAddress}</p>
              {academy.jibunAddress && (
                <p className="text-xs text-slate-400">{academy.jibunAddress}</p>
              )}
            </div>
            <button
              onClick={handleCopyAddress}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium px-2 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨' : '주소 복사'}</span>
            </button>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1">
              {academy.tel && academy.tel !== '전화번호 미제공' ? (
                <a
                  href={`tel:${academy.tel}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {academy.tel}
                </a>
              ) : (
                <span className="text-slate-400 text-xs">전화번호 미등록</span>
              )}
            </div>
          </div>

          {/* Education office details grid */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">관할 교육청</span>
              <span className="font-semibold text-slate-800">{academy.ofcdcName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">행정구역</span>
              <span className="font-semibold text-slate-800">{academy.admstZone}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">수강료 정보</span>
              <span className="font-semibold text-slate-800">{academy.tuition || '교육청 고시 기준'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">학습 대상</span>
              <span className="font-semibold text-slate-800">{academy.targetGrade || '초등·중등·고등'}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Favorite Toggle */}
          <button
            onClick={() => onToggleFavorite(academy)}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border ${
              isFavorite
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>{isFavorite ? '즐겨찾기 됨' : '즐겨찾기 추가'}</span>
          </button>

          {/* Route Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFindRoute(academy, 'pedestrian');
                onClose();
              }}
              className="py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>도보 길찾기</span>
            </button>

            <button
              onClick={() => {
                onFindRoute(academy, 'car');
                onClose();
              }}
              className="py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Car className="w-3.5 h-3.5" />
              <span>차량 길찾기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
