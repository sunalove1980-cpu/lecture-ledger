import React, { useEffect, useRef, useState } from 'react';
import { X, Calendar, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GoogleCalendarConfig, Lecture } from '../types/lecture';
import {
  initTokenClient,
  requestAccessToken,
  fetchCalendarEvents,
  parseGEventsToLectures,
  setAccessToken,
} from '../services/googleCalendar';
import { saveLecture, getLectures } from '../services/storage';

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
  const hasStartedQuickSync = useRef(false);

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

      // 3. 캘린더에서 이벤트 가져오기
      const events = await fetchCalendarEvents(accessToken, calendarId.trim() || 'primary');

      // 4. [G] 이벤트 필터링
      const gLectures = parseGEventsToLectures(events);

      // 5. 기존 강의 데이터와 병합 (중복 방지)
      const existingLectures = getLectures();
      const existingByGCalId = new Map(
        existingLectures.filter((l) => l.googleCalendarEventId).map((l) => [l.googleCalendarEventId, l]),
      );

      let addedCount = 0;
      let updatedCount = 0;
      for (const gl of gLectures) {
        const existing = existingByGCalId.get(gl.googleCalendarEventId);
        saveLecture({
          id: existing?.id,
          title: gl.title,
          agency: gl.agency,
          date: gl.date,
          startTime: gl.startTime,
          endTime: gl.endTime,
          durationHours: gl.durationHours,
          totalFee: gl.totalFee,
          isPaid: existing?.isPaid || false,
          paidDate: existing?.paidDate,
          locationType: gl.locationDetail ? 'offline' : 'online',
          locationDetail: gl.locationDetail,
          notes: gl.notes,
          googleCalendarEventId: gl.googleCalendarEventId,
        });
        if (existing) updatedCount++;
        else addedCount++;
      }

      // 6. 설정 저장
      const newConfig: GoogleCalendarConfig = {
        calendarId: calendarId.trim() || 'primary',
        isConnected: true,
        autoSync: true,
        userEmail: email,
        lastSyncedAt: new Date().toISOString(),
      };
      onSaveConfig(newConfig);

      // 7. 최신 데이터로 콜백
      onSyncComplete(getLectures());

      setStatus({
        type: 'success',
        message: `${email} 동기화 완료! 신규 ${addedCount}건 추가, 기존 ${updatedCount}건 갱신.`,
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

  // 연동 완료 후에는 헤더의 동기화 버튼을 누르는 것만으로 즉시 동기화합니다.
  useEffect(() => {
    if (!isOpen) {
      hasStartedQuickSync.current = false;
      return;
    }

    if (config.isConnected && !hasStartedQuickSync.current) {
      hasStartedQuickSync.current = true;
      void handleGoogleLogin();
    }
    // 모달이 열리는 순간에 한 번만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h3 className="text-base font-bold text-gray-900">구글 캘린더 연동</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
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
            가 포함된 이벤트만 가져와서 강의 일정으로 등록합니다.
          </div>

          {/* 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || !googleClientId}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? '연동 중...' : config.isConnected ? '다시 동기화' : '구글로 로그인 & 캘린더 연동'}
          </button>
        </div>
      </div>
    </div>
  );
};
