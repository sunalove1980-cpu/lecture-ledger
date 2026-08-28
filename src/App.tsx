import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getLectures,
  saveLecture,
  deleteLecture,
  togglePaymentStatus,
  resetToSampleData,
  getGoogleConfig,
  saveGoogleConfig,
} from './services/storage';
import { exportToCsv } from './services/exportCsv';
import type { Lecture, GoogleCalendarConfig } from './types/lecture';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { MonthlyChart } from './components/MonthlyChart';
import { AgencyChart } from './components/AgencyChart';
import { LectureCalendar } from './components/LectureCalendar';
import { LectureList } from './components/LectureList';
import { LectureModal } from './components/LectureModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  ListFilter,
  BarChart3,
} from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from 'date-fns';
import confetti from 'canvas-confetti';

type TabId = 'home' | 'calendar' | 'list' | 'stats';

export const App: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Modals
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [newLectureDefaultDate, setNewLectureDefaultDate] = useState<string | undefined>();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Google
  const [googleConfig, setGoogleConfig] = useState<GoogleCalendarConfig>(getGoogleConfig());
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // ─── 데이터 로드 ────────────────────────────────────
  const refreshData = useCallback(() => {
    setIsAutoSyncing(true);
    setLectures(getLectures());
    setTimeout(() => setIsAutoSyncing(false), 300);
  }, []);

  useEffect(() => {
    refreshData();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshData();
    };
    window.addEventListener('focus', refreshData);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refreshData);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshData]);

  // ─── 파생 데이터 ────────────────────────────────────
  const currentMonthLectures = useMemo(() => {
    const s = startOfMonth(currentMonth);
    const e = endOfMonth(currentMonth);
    return lectures.filter((l) => isWithinInterval(new Date(l.date), { start: s, end: e }));
  }, [lectures, currentMonth]);

  const prevMonthTotalFee = useMemo(() => {
    const pm = subMonths(currentMonth, 1);
    const s = startOfMonth(pm);
    const e = endOfMonth(pm);
    return lectures
      .filter((l) => isWithinInterval(new Date(l.date), { start: s, end: e }))
      .reduce((sum, l) => sum + (l.totalFee || 0), 0);
  }, [lectures, currentMonth]);

  // ─── 핸들러 ─────────────────────────────────────────
  const handleOpenNewLecture = (dateStr?: string) => {
    setEditingLecture(null);
    setNewLectureDefaultDate(dateStr || format(currentMonth, 'yyyy-MM-dd'));
    setIsLectureModalOpen(true);
  };

  const handleEditLecture = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setIsLectureModalOpen(true);
  };

  const handleSaveLecture = async (
    data: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => {
    saveLecture(data);
    setLectures(getLectures());
  };

  const handleDeleteLecture = (id: string) => {
    if (window.confirm('이 강의를 삭제하시겠습니까?')) {
      deleteLecture(id);
      setLectures(getLectures());
    }
  };

  const handleTogglePayment = (id: string) => {
    const updated = togglePaymentStatus(id);
    if (updated?.isPaid) {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    }
    setLectures(getLectures());
  };

  const handleResetData = () => {
    if (window.confirm('샘플 데이터로 복원하시겠습니까?')) {
      setLectures(resetToSampleData());
    }
  };

  const handleExportCsv = () => {
    exportToCsv(currentMonthLectures, `강의료정산_${format(currentMonth, 'yyyy년_MM월')}`);
  };

  const handleSaveGoogleConfig = (c: GoogleCalendarConfig) => {
    setGoogleConfig(c);
    saveGoogleConfig(c);
  };

  // ─── 탭 정의 ────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: '홈', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'calendar', label: '캘린더', icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'list', label: '목록', icon: <ListFilter className="w-5 h-5" /> },
    { id: 'stats', label: '통계', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="h-dvh flex flex-col bg-[#f3f0e8] text-[#171916]">

      {/* ── 헤더 ── */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onOpenNewLectureModal={() => handleOpenNewLecture()}
        onOpenGoogleSyncModal={() => setIsGoogleModalOpen(true)}
        onExportCsv={handleExportCsv}
        onResetData={handleResetData}
        isGoogleConnected={googleConfig.isConnected}
        userEmail={googleConfig.userEmail}
        isAutoSyncing={isAutoSyncing}
      />

      {/* ── 데스크톱 탭바 ── */}
      <div className="hidden border-b border-[#d9d5c9] bg-[#f3f0e8] md:block">
        <div className="mx-auto flex max-w-7xl items-center px-7">
          {tabs.map((tab, index) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative mr-8 py-4 text-xs font-black tracking-[0.04em] transition-colors ${activeTab === tab.id ? 'text-[#171916]' : 'text-[#9a988f] hover:text-[#55564f]'}`}>
              <span className="mr-2 text-[9px] text-[#aaa89f]">0{index + 1}</span>{tab.label}{tab.id === 'list' && ` ${currentMonthLectures.length}`}
              {activeTab === tab.id && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#171916]" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── 메인 콘텐츠 (뷰포트 높이를 채움, 내부 스크롤) ── */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">

          {activeTab === 'home' && (
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-7 sm:py-8">
              <div className="mb-5 flex items-end justify-between sm:mb-7">
                <div><p className="text-[10px] font-black tracking-[0.18em] text-[#89877e]">OVERVIEW</p><h1 className="mt-1 text-2xl font-black tracking-[-0.055em] sm:text-3xl">이번 달의 강의 원장</h1></div>
                <p className="hidden max-w-xs text-right text-xs leading-5 text-[#77766e] sm:block">수입과 정산, 강의 시간을<br/>한눈에 확인하세요.</p>
              </div>
              <DashboardStats lectures={currentMonthLectures} prevMonthTotal={prevMonthTotalFee} />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-7 py-5 sm:py-8">
              <LectureCalendar
                currentMonth={currentMonth}
                lectures={currentMonthLectures}
                onSelectLecture={handleEditLecture}
                onAddNewAtDate={handleOpenNewLecture}
              />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-7 py-5 sm:py-8">
              <LectureList
                lectures={currentMonthLectures}
                onEdit={handleEditLecture}
                onDelete={handleDeleteLecture}
                onTogglePaid={handleTogglePayment}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-7 py-5 sm:py-8 space-y-4">
              <MonthlyChart
                allLectures={lectures}
                currentMonth={currentMonth}
                onSelectMonth={setCurrentMonth}
              />
              <AgencyChart lectures={currentMonthLectures} />
            </div>
          )}

        </div>
      </main>

      {/* ── 모바일 하단 탭바 ── */}
      <div className="md:hidden flex items-center justify-around bg-[#171916] border-t border-black px-2 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-bold transition-colors ${
              activeTab === tab.id ? 'text-[#d9ff57]' : 'text-[#85877f]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── 모달 ── */}
      <LectureModal
        isOpen={isLectureModalOpen}
        onClose={() => setIsLectureModalOpen(false)}
        onSave={handleSaveLecture}
        initialLecture={editingLecture}
        defaultDate={newLectureDefaultDate}
        isGoogleConnected={googleConfig.isConnected}
      />

      <GoogleSyncModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        config={googleConfig}
        onSaveConfig={handleSaveGoogleConfig}
        onSyncComplete={(lecs) => setLectures(lecs)}
      />
    </div>
  );
};

export default App;
