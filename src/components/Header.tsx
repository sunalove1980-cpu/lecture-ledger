import React from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  RefreshCw, 
  Sparkles,
  CalendarCheck2
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
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  onOpenNewLectureModal,
  onOpenGoogleSyncModal,
  onExportCsv,
  onResetData,
  isGoogleConnected,
}) => {
  const handlePrevMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const handleCurrentMonth = () => onMonthChange(new Date());

  const monthLabel = format(currentMonth, 'yyyy년 M월', { locale: ko });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  강의료 & 일정 매니저
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Lecture Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                구글 캘린더 연동 · 월별 정산 및 업체별 실적 관리
              </p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={handlePrevMonth}
              title="이전 달"
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-none hover:shadow-xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center px-2 sm:px-3 text-center">
              <CalendarIcon className="w-4 h-4 text-indigo-600 mr-1.5 hidden xs:inline" />
              <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight whitespace-nowrap">
                {monthLabel}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              title="다음 달"
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-none hover:shadow-xs active:scale-95"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="ml-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-white rounded-md transition-all hidden md:inline-block"
            >
              이번 달
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Google Sync Button */}
            <button
              onClick={onOpenGoogleSyncModal}
              title="구글 캘린더 연동"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all ${
                isGoogleConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isGoogleConnected ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {isGoogleConnected ? '캘린더 연동됨' : '구글 연동'}
              </span>
            </button>

            {/* CSV Export Button */}
            <button
              onClick={onExportCsv}
              title="엑셀(CSV) 다운로드"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>엑셀 다운로드</span>
            </button>

            {/* Reset Sample Button */}
            <button
              onClick={onResetData}
              title="샘플 데이터 복원"
              className="hidden xl:flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>샘플 복원</span>
            </button>

            {/* New Lecture Button */}
            <button
              onClick={onOpenNewLectureModal}
              className="flex items-center gap-1 sm:gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              <span>강의 등록</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};