import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Download, RefreshCw } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HeaderProps {
  currentMonth: Date; onMonthChange: (date: Date) => void; onOpenNewLectureModal: () => void;
  onOpenGoogleSyncModal: () => void; onExportCsv: () => void; onResetData: () => void;
  isGoogleConnected: boolean; userEmail?: string; isAutoSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentMonth, onMonthChange, onOpenNewLectureModal,
  onOpenGoogleSyncModal, onExportCsv, isGoogleConnected, userEmail, isAutoSyncing }) => {
  const monthLabel = format(currentMonth, 'yyyy년 M월', { locale: ko });
  return (
    <header className="border-b border-[#d9d5c9] bg-[#f3f0e8]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center bg-[#171916] text-sm font-black tracking-[-0.08em] text-[#d9ff57]">LL</div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[15px] font-black leading-none tracking-[-0.04em] text-[#171916]">LECTURE LEDGER</p>
            <p className="mt-1.5 hidden truncate text-[10px] font-semibold tracking-[0.08em] text-[#77766e] sm:block">
              {isGoogleConnected && userEmail ? userEmail : 'PERSONAL LECTURE ACCOUNT'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 border border-[#d2cec2] bg-[#ebe7dc] p-1">
          <button onClick={() => onMonthChange(subMonths(currentMonth, 1))} className="p-2 text-[#696961] transition hover:bg-white hover:text-black" aria-label="이전 달"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => onMonthChange(new Date())} className="min-w-[104px] px-2 text-center text-xs font-black tracking-[-0.02em] text-[#171916] sm:min-w-[126px] sm:text-sm">{monthLabel}</button>
          <button onClick={() => onMonthChange(addMonths(currentMonth, 1))} className="p-2 text-[#696961] transition hover:bg-white hover:text-black" aria-label="다음 달"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={onOpenGoogleSyncModal} title={isGoogleConnected ? '새 캘린더 일정 동기화' : '구글 캘린더 연동'}
            className={`flex h-10 items-center gap-2 border px-3 text-xs font-extrabold transition ${isGoogleConnected ? 'border-[#171916] bg-[#171916] text-white hover:bg-[#30332d]' : 'border-[#c9c5b9] text-[#55564f] hover:bg-white'}`}>
            <RefreshCw className={`h-4 w-4 ${isAutoSyncing ? 'animate-spin' : ''}`} /><span className="hidden lg:inline">{isGoogleConnected ? 'SYNC' : 'CONNECT'}</span>
          </button>
          <button onClick={onExportCsv} title="엑셀 다운로드" className="hidden h-10 w-10 place-items-center border border-[#c9c5b9] text-[#55564f] transition hover:bg-white sm:grid"><Download className="h-4 w-4" /></button>
          <button onClick={onOpenNewLectureModal} className="flex h-10 items-center gap-2 bg-[#d9ff57] px-3.5 text-xs font-black text-[#171916] transition hover:bg-[#c9ef48] active:translate-y-px"><Plus className="h-4 w-4 stroke-[2.5]" /><span className="hidden sm:inline">새 강의</span></button>
        </div>
      </div>
    </header>
  );
};
