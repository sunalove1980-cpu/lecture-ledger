import React from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  RefreshCw, 
  Sparkles,
  CalendarCheck2,
  CheckCircle2
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HeaderProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onOpenNewLectureModal: () => void;
  onOpenGoogleSyncModal: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
  isGoogleConnected: boolean;
  userEmail?: string;
  isAutoSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  onOpenNewLectureModal,
  onOpenGoogleSyncModal,
  onExportCsv,
  onResetData,
  isGoogleConnected,
  userEmail,
  isAutoSyncing,
}) => {
  const handlePrevMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const handleCurrentMonth = () => onMonthChange(new Date());

  const monthLabel = format(currentMonth, 'yyyy년 M월', { locale: ko });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-sm shadow-sky-200 shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate">
                  강의료 & 일정 매니저
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100 whitespace-nowrap">
                  Lecture Ledger
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {isGoogleConnected && userEmail ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-medium truncate">
                    <span className={`w-1.5 h-1.5 rounded-full bg-teal-500 ${isAutoSyncing ? 'animate-ping' : ''}`}></span>
                    <span className="truncate">{userEmail}</span>
                    <span className="text-slate-400 hidden sm:inline">· 자동 연동 중</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    월별 강의비 및 위탁업체 실적 관리
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 shrink-0">
            <button
              onClick={handlePrevMonth}
              title="이전 달"
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-none hover:shadow-xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
            <div className="flex items-center px-2 sm:px-2.5 text-center">
              <CalendarIcon className="w-3.5 h-3.5 text-sky-600 mr-1.5 hidden xs:inline" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">
                {monthLabel}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              title="다음 달"
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-none hover:shadow-xs active:scale-95"
            >
              <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="ml-1 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:text-sky-700 hover:bg-white rounded-lg transition-all hidden md:inline-block"
            >
              이번 달
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Google Sync Button */}
            <button
              onClick={onOpenGoogleSyncModal}
              title="구글 캘린더 연동 설정"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl border transition-all ${
                isGoogleConnected
                  ? 'bg-teal-50/80 text-teal-700 border-teal-200/80 hover:bg-teal-100/80'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isAutoSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              ) : isGoogleConnected ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline whitespace-nowrap">
                {isGoogleConnected ? '구글 연동됨' : '구글 로그인'}
              </span>
            </button>

            {/* CSV Export Button */}
            <button
              onClick={onExportCsv}
              title="엑셀(CSV) 다운로드"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>엑셀 다운로드</span>
            </button>

            {/* Reset Sample Button */}
            <button
              onClick={onResetData}
              title="샘플 데이터 복원"
              className="hidden xl:flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>샘플 복원</span>
            </button>

            {/* New Lecture Button */}
            <button
              onClick={onOpenNewLectureModal}
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-sky-200 hover:shadow-md hover:shadow-sky-300 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>강의 등록</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};