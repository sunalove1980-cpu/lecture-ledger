import React, { useState } from 'react';
import { X, Calendar, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GoogleCalendarConfig, Lecture } from '../types/lecture';
import {
  initTokenClient,
  requestAccessToken,
  setAccessToken,
  GOOGLE_SYNC_START_DATE,
} from '../services/googleCalendar';
import { syncLumiCalendar, formatSyncSummary } from '../services/calendarSync';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleCalendarConfig;
  onSaveConfig: (config: GoogleCalendarConfig) => void;
  onSyncComplete: (lectures: Lecture[]) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSyncComplete,
}) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
  const [calendarId, setCalendarId] = useState(config.calendarId || 'primary');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleGoogleLogin = async () => {
    if (!googleClientId) {
      setStatus({ type: 'error', message: '현재 Google 로그인을 준비 중입니다. 관리자에게 문의해 주세요.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'info', message: '구글 로그인 창을 열고 있습니다...' });

    try {
      // 1. Token Client 초기화
      await initTokenClient(googleClientId);

      // 2. 구글 로그인 팝업 → Access Token 획득
      // 이미 연동한 계정은 별도의 동의 화면 없이 바로 토큰을 갱신합니다.
      const { accessToken, email } = await requestAccessToken(config.isConnected ? '' : 'consent');
      setAccessToken(accessToken);

      setStatus({ type: 'info', message: `${email} 계정으로 캘린더 이벤트를 가져오는 중...` });

      const result = await syncLumiCalendar(accessToken, calendarId.trim() || 'primary');
      onSyncComplete(result.lectures);

      // 6. 설정 저장
      const newConfig: GoogleCalendarConfig = {
        calendarId: calendarId.trim() || 'primary',
        isConnected: true,
        autoSync: true,
        userEmail: email,
        lastSyncedAt: new Date().toISOString(),
      };
      let configWarning = '';
      try { onSaveConfig(newConfig); } catch { configWarning = ' 연결 설정 저장은 실패했습니다.'; }

      setStatus({
        type: 'success',
        message: `${formatSyncSummary(result)}${configWarning}`,
      });
    } catch (err: any) {
      console.error('Google Sync Error:', err);
      setStatus({
        type: 'error',
        message: `연동 실패: ${err.message || '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDisconnect = () => {
    onSaveConfig({
      calendarId: 'primary',
      isConnected: false,
      autoSync: false,
      userEmail: undefined,
      accessToken: undefined,
    });
    setStatus({ type: 'info', message: '구글 계정 연동이 해제되었습니다.' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#171916]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-[#f8f6ef] max-w-lg w-full shadow-2xl border border-[#d4d0c4] overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h3 className="text-base font-bold text-gray-900">구글 캘린더 연동</h3>
          </div>
          <button onClick={onClose} aria-label="구글 캘린더 연동 창 닫기" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status */}
          {status && (
            <div
              className={`p-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : status.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              ) : status.type === 'error' ? (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              ) : null}
              <span>{status.message}</span>
            </div>
          )}

          {/* 연동 상태 */}
          {config.isConnected && config.userEmail && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">연동된 계정</p>
                  <p className="text-sm text-gray-500 mt-0.5">{config.userEmail}</p>
                  {config.lastSyncedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      마지막 동기화: {new Date(config.lastSyncedAt).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                >
                  연동 해제
                </button>
              </div>
            </div>
          )}

          {!googleClientId && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
              Google 로그인 설정이 아직 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.
            </div>
          )}

          {/* Calendar ID */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              캘린더 ID <span className="font-normal text-gray-400">(기본: primary)</span>
            </label>
            <input
              type="text"
              placeholder="primary"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* 연동 안내 */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">연동 방식:</strong> 구글 캘린더에서 제목에
            <code className="bg-gray-200 px-1.5 py-0.5 rounded font-bold text-gray-800 mx-1">[G]</code>
            로 시작하고 설명에 <strong className="text-gray-700">등록: 루미</strong>가 한 줄로 표시된 일정 중,
            <strong className="text-gray-700"> {GOOGLE_SYNC_START_DATE.replaceAll('-', '.')} 00:00 (한국 시간) 이후 생성된 새 일정만</strong> 추가합니다.
            중복은 건너뛰며 기존 수입·입금 여부·메모는 변경하지 않습니다. 처음 추가하기 전에 이 브라우저에 원본을 백업합니다.
          </div>

          <p className="text-xs leading-relaxed text-gray-600">
            아래 버튼을 눌렀을 때만 Google 인증과 새 일정 가져오기를 시작합니다.
          </p>

          {/* 사용자가 직접 요청할 때만 인증과 가져오기를 시작합니다. */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || !googleClientId}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? '가져오는 중...' : config.isConnected ? '새 일정 가져오기' : '구글 계정 연결 후 새 일정 가져오기'}
          </button>
        </div>
      </div>
    </div>
  );
};
