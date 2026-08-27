import React, { useState } from 'react';
import { X, Calendar, ExternalLink, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [clientId, setClientId] = useState(config.clientId || '');
  const [calendarId, setCalendarId] = useState(config.calendarId || 'primary');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    const id = clientId.trim();
    if (!id) {
      setStatus({ type: 'error', message: 'Client ID를 먼저 입력해 주세요.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'info', message: '구글 로그인 창을 열고 있습니다...' });

    try {
      // 1. Token Client 초기화
      await initTokenClient(id);

      // 2. 구글 로그인 팝업 → Access Token 획득
      const { accessToken, email } = await requestAccessToken();
      setAccessToken(accessToken);

      setStatus({ type: 'info', message: `${email} 계정으로 캘린더 이벤트를 가져오는 중...` });

      // 3. 캘린더에서 이벤트 가져오기
      const events = await fetchCalendarEvents(accessToken, calendarId.trim() || 'primary');

      // 4. [G] 이벤트 필터링
      const gLectures = parseGEventsToLectures(events);

      // 5. 기존 강의 데이터와 병합 (중복 방지)
      const existingLectures = getLectures();
      const existingGCalIds = new Set(
        existingLectures.filter((l) => l.googleCalendarEventId).map((l) => l.googleCalendarEventId),
      );

      let addedCount = 0;
      for (const gl of gLectures) {
        if (!existingGCalIds.has(gl.googleCalendarEventId)) {
          saveLecture({
            title: gl.title,
            agency: '',
            date: gl.date,
            startTime: gl.startTime,
            endTime: gl.endTime,
            durationHours: gl.durationHours,
            totalFee: gl.totalFee,
            isPaid: false,
            locationType: gl.locationDetail ? 'offline' : 'online',
            locationDetail: gl.locationDetail,
            notes: gl.notes,
            googleCalendarEventId: gl.googleCalendarEventId,
          });
          addedCount++;
        }
      }

      // 6. 설정 저장
      const newConfig: GoogleCalendarConfig = {
        clientId: id,
        calendarId: calendarId.trim() || 'primary',
        isConnected: true,
        autoSync: true,
        userEmail: email,
        accessToken,
        lastSyncedAt: new Date().toISOString(),
      };
      onSaveConfig(newConfig);

      // 7. 최신 데이터로 콜백
      onSyncComplete(getLectures());

      setStatus({
        type: 'success',
        message: `${email} 연동 완료! [G] 이벤트 ${gLectures.length}건 발견, 신규 ${addedCount}건 추가.`,
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

  const handleDisconnect = () => {
    onSaveConfig({
      clientId: '',
      calendarId: 'primary',
      isConnected: false,
      autoSync: false,
      userEmail: undefined,
      accessToken: undefined,
    });
    setClientId('');
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

          {/* Client ID 입력 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Google OAuth Client ID
            </label>
            <input
              type="text"
              placeholder="123456789-xxxxxxxxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="mt-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Client ID를 어떻게 발급받나요?
            </button>
          </div>

          {/* Client ID 발급 가이드 */}
          {showGuide && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 space-y-2">
              <p className="font-bold text-gray-900">Client ID 발급 방법 (무료, 1회만)</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-xs leading-relaxed">
                <li>
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    Google Cloud Console
                  </a>
                  에 접속하여 새 프로젝트를 만드세요.
                </li>
                <li>
                  좌측 메뉴 → "API 및 서비스" → "라이브러리" → <strong>Google Calendar API</strong>를
                  검색하여 "사용" 버튼을 눌러 활성화하세요.
                </li>
                <li>
                  "API 및 서비스" → "OAuth 동의 화면" → 외부 선택 → 앱 이름/이메일 입력 후 저장.
                </li>
                <li>
                  "OAuth 동의 화면" → "테스트 사용자" 탭 → 본인 Gmail 주소를 추가하세요.
                </li>
                <li>
                  "사용자 인증 정보" → "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
                  → 유형: <strong>웹 애플리케이션</strong>
                </li>
                <li>
                  "승인된 JavaScript 원본"에 다음 URL들을 추가하세요:
                  <br />
                  <code className="bg-gray-200 px-1 rounded text-xs">http://localhost:5173</code>
                  <br />
                  <code className="bg-gray-200 px-1 rounded text-xs">
                    https://temporary-prompt-antimony-u8yxtx4.vercel.app
                  </code>
                </li>
                <li>
                  "만들기" 버튼을 누르면 <strong>Client ID</strong>가 표시됩니다. 이것을 위에 붙여넣으세요.
                </li>
              </ol>
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
            disabled={isLoading || !clientId.trim()}
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