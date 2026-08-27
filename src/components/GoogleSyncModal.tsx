import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  RefreshCw, 
  Key, 
  Sparkles,
  Zap
} from 'lucide-react';
import type { GoogleCalendarConfig, Lecture } from '../types/lecture';
import { 
  initGoogleClient, 
  requestGoogleAuth, 
  fetchGoogleCalendarEvents,
  simulateGoogleCalendarSync
} from '../services/googleCalendar';


interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleCalendarConfig;
  onSaveConfig: (config: GoogleCalendarConfig) => void;
  currentLectures: Lecture[];
  onSyncComplete: (updatedLectures: Lecture[]) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  currentLectures,
  onSyncComplete,
}) => {
  const [clientId, setClientId] = useState(config.clientId || '');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [calendarId, setCalendarId] = useState(config.calendarId || 'primary');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sync' | 'settings'>('sync');

  if (!isOpen) return null;

  const handleSimulateSync = () => {
    setIsLoading(true);
    setTimeout(() => {
      const result = simulateGoogleCalendarSync(currentLectures);
      onSyncComplete(result.newLectures);
      setIsLoading(false);
      setStatusMessage(`✨ 구글 캘린더에서 ${result.syncedCount}개의 새로운 강의 일정을 성공적으로 동기화했습니다!`);
    }, 600);
  };

  const handleLiveSync = async () => {
    if (!clientId || !apiKey) {
      setActiveTab('settings');
      setStatusMessage('⚠️ 구글 캘린더 API Key와 Client ID를 먼저 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('구글 캘린더 인증을 진행하고 있습니다...');

    const newConfig = {
      clientId,
      apiKey,
      calendarId,
      isConnected: true,
      lastSyncedAt: new Date().toISOString(),
    };
    onSaveConfig(newConfig);

    try {
      await initGoogleClient(
        newConfig,
        async () => {
          try {
            await requestGoogleAuth();
            const events = await fetchGoogleCalendarEvents(calendarId);
            setStatusMessage(`✅ 구글 캘린더에서 ${events.length}개의 일정을 조회했습니다.`);
            setIsLoading(false);
          } catch (err: any) {
            setStatusMessage(`❌ 인증 또는 일정 조회 실패: ${err.message || err}`);
            setIsLoading(false);
          }
        },
        (err) => {
          setStatusMessage(`❌ 클라이언트 초기화 실패: ${err.message}`);
          setIsLoading(false);
        }
      );
    } catch (err: any) {
      setStatusMessage(`❌ 오류 발생: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      clientId: clientId.trim(),
      apiKey: apiKey.trim(),
      calendarId: calendarId.trim() || 'primary',
      isConnected: Boolean(clientId && apiKey),
      lastSyncedAt: config.lastSyncedAt,
    });
    setStatusMessage('설정이 저장되었습니다.');
    setActiveTab('sync');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                구글 캘린더 연동 및 동기화
              </h3>
              <p className="text-xs text-slate-500">
                구글 캘린더와 강의 일정을 양방향으로 동기화합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/30">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'sync'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            동기화 실행
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            API 연동 설정
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {statusMessage && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs font-medium text-indigo-900 animate-in fade-in">
              {statusMessage}
            </div>
          )}

          {activeTab === 'sync' ? (
            <div className="space-y-4">
              
              {/* Live Sync Action */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      실시간 구글 캘린더 동기화
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      구글 캘린더의 최신 일정을 가져오거나 앱의 강의 일정을 캘린더로 내보냅니다.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLiveSync}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? '동기화 진행 중...' : '구글 계정으로 지금 동기화하기'}
                </button>
              </div>

              {/* Demo 1-Click Sync */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-50/50 to-violet-50/50 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800">
                    간편 체험 (원클릭 모의 동기화)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  구글 API 키 발급 전이라도 캘린더 연동 및 강의 일정 자동 반영 효과를 즉시 테스트해볼 수 있습니다.
                </p>
                <button
                  onClick={handleSimulateSync}
                  disabled={isLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5" />
                  체험용 일정 가져오기
                </button>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                <p>• 구글 캘린더 제목에 [강의] 또는 업체명이 포함된 일정을 자동으로 분석합니다.</p>
                <p>• 앱에서 강의를 등록할 때 '구글 캘린더 동시 등록'을 체크하면 자동으로 캘린더에 저장됩니다.</p>
              </div>

            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Google OAuth Client ID
                </label>
                <input
                  type="text"
                  placeholder="예: xxxxx.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Google API Key
                </label>
                <input
                  type="password"
                  placeholder="예: AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  캘린더 ID
                </label>
                <input
                  type="text"
                  placeholder="primary (기본값)"
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  Google Cloud Console 설정 가이드
                </div>
                <p>1. Google Cloud Console에서 프로젝트 생성 후 'Google Calendar API' 사용 설정</p>
                <p>2. 사용자 인증 정보에서 OAuth 2.0 클라이언트 ID 및 API 키 생성</p>
                <p>3. 승인된 자바스크립트 원본에 현재 웹 주소를 등록하세요.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
                >
                  설정 저장
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};