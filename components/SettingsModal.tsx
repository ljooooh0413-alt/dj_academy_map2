'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseCredentials, saveCustomSupabaseCredentials } from '@/lib/supabase';
import { X, Settings, CheckCircle2, AlertTriangle, KeyRound, Database, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onCredentialsUpdated,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <SettingsModalContent
      onClose={onClose}
      onCredentialsUpdated={onCredentialsUpdated}
    />
  );
}

function SettingsModalContent({
  onClose,
  onCredentialsUpdated,
}: {
  onClose: () => void;
  onCredentialsUpdated: () => void;
}) {
  const [supabaseUrl, setSupabaseUrl] = useState(() => getSupabaseCredentials().url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => getSupabaseCredentials().anonKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseCredentials(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsSaved(true);
    onCredentialsUpdated();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    saveCustomSupabaseCredentials('', '');
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    onCredentialsUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">시스템 연동 및 API 설정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Status Overview Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>연동 서비스 가동 현황</span>
            </div>
            <div className="space-y-1.5 text-slate-600 text-[11px]">
              <div className="flex items-center justify-between">
                <span>1. 나이스(NEIS) 학원 정보</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200/60">
                  정상 가동 (실시간/정밀 데이터셋)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. TMAP / OSRM 길안내 엔진</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200/60">
                  실시간 라우팅 연결 완료
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. 즐겨찾기 저장소</span>
                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200/60">
                  하이브리드 (로컬 + Supabase)
                </span>
              </div>
            </div>
          </div>

          {/* Supabase Custom Credentials Input */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase 커스텀 프로젝트 연결 (선택)</span>
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                title="초기화"
              >
                <RefreshCw className="w-3 h-3" />
                <span>초기화</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Supabase 프로젝트 URL과 Anon Public Key를 입력하시면 클라우드 원격 DB 동기화가 활성화됩니다.
            </p>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Anon Public Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJh..."
                className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {isSaved && (
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>설정이 안전하게 저장되었습니다!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              닫기
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              설정 저장 및 적용
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
