'use client';

import React, { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { X, LogIn, UserPlus, LogOut, CheckCircle2, ShieldCheck, Github } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onLoginSuccess: (email: string, userId: string) => void;
  onLogout: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  userEmail,
  onLoginSuccess,
  onLogout,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const client = getSupabaseClient();
    if (!client) {
      // Offline / LocalStorage demo mode
      setTimeout(() => {
        onLoginSuccess(email, `local_user_${Date.now()}`);
        setLoading(false);
        setMessage({
          type: 'success',
          text: '로컬 프로필로 로그인되었습니다. (Supabase 연동 시 클라우드 동기화 지원)',
        });
        setTimeout(onClose, 1000);
      }, 500);
      return;
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          onLoginSuccess(data.user.email || email, data.user.id);
          setMessage({ type: 'success', text: '회원가입 및 로그인이 완료되었습니다!' });
          setTimeout(onClose, 1000);
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          onLoginSuccess(data.user.email || email, data.user.id);
          setMessage({ type: 'success', text: '로그인에 성공했습니다.' });
          setTimeout(onClose, 1000);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubOAuth = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setMessage({
        type: 'error',
        text: 'Supabase 연동 정보가 설정되어 있지 않습니다. [설정] 탭에서 Supabase URL과 키를 입력해주세요.',
      });
      return;
    }

    try {
      await client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'GitHub 로그인 실패';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              E
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {userEmail ? '계정 및 동기화 상태' : 'EduMap 사용자 로그인'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {userEmail ? (
            /* Logged In State */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-900">로그인 활성화됨</p>
                  <p className="text-xs text-emerald-700">{userEmail}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>즐겨찾기 클라우드 자동 동기화</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  즐겨찾기에 등록한 학원 목록이 Supabase 데이터베이스와 실시간 동기화되어 어느 기기에서나 안전하게 유지됩니다.
                </p>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            /* Login / Signup Form */
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {/* GitHub OAuth Button */}
              <button
                type="button"
                onClick={handleGithubOAuth}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Github className="w-4 h-4" />
                <span>GitHub으로 시작하기</span>
              </button>

              <div className="flex items-center gap-2 my-2 text-slate-400 text-[11px]">
                <div className="h-px bg-slate-200 flex-1" />
                <span>또는 이메일 로그인</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  이메일 주소
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Feedback Message */}
              {message && (
                <div
                  className={`p-2.5 rounded-lg text-xs ${
                    message.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>이메일 로그인</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>새 계정 만들기</span>
                  </>
                )}
              </button>

              {/* Mode Toggle */}
              <div className="pt-2 text-center text-xs text-slate-500">
                {mode === 'login' ? (
                  <span>
                    아직 계정이 없으신가요?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      회원가입
                    </button>
                  </span>
                ) : (
                  <span>
                    이미 계정이 있으신가요?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      로그인하기
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
