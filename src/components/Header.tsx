import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  RefreshCw,
  Calendar,
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
  isGoogleConnected,
  userEmail,
  isAutoSyncing,
}) => {
  const handlePrevMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const handleCurrentMonth = () => onMonthChange(new Date());

  const monthLabel = format(currentMonth, 'yyyy년 M월', { locale: ko });

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-2">

          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                강의료 매니저
              </h1>
              {isGoogleConnected && userEmail && (
                <p className="text-[11px] text-gray-400 truncate hidden sm:block">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 ${isAutoSyncing ? 'animate-pulse' : ''}`} />
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="px-2 py-1 text-sm font-bold text-gray-900 rounded-lg hover:bg-gray-100 whitespace-nowrap"
            >
              {monthLabel}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenGoogleSyncModal}
              title="구글 캘린더 연동"
              className={`p-2 rounded-lg transition-colors ${
                isGoogleConnected
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isAutoSyncing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onExportCsv}
              title="엑셀 다운로드"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 hidden sm:block"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenNewLectureModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">강의 등록</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};