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
  Plus,
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
    <div className="h-dvh flex flex-col bg-gray-50 text-gray-900">

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
      <div className="hidden md:flex border-b border-gray-200 bg-white px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.id === 'list' && ` (${currentMonthLectures.length})`}
          </button>
        ))}
      </div>

      {/* ── 메인 콘텐츠 (뷰포트 높이를 채움, 내부 스크롤) ── */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">

          {activeTab === 'home' && (
            <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4">
              <DashboardStats lectures={currentMonthLectures} prevMonthTotal={prevMonthTotalFee} />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4">
              <LectureCalendar
                currentMonth={currentMonth}
                lectures={currentMonthLectures}
                onSelectLecture={handleEditLecture}
                onAddNewAtDate={handleOpenNewLecture}
              />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4">
              <LectureList
                lectures={currentMonthLectures}
                onEdit={handleEditLecture}
                onDelete={handleDeleteLecture}
                onTogglePaid={handleTogglePayment}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4">
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
      <div className="md:hidden flex items-center justify-around bg-white border-t border-gray-200 px-2 py-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[11px] font-bold transition-colors ${
              activeTab === tab.id ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        {/* FAB */}
        <button
          onClick={() => handleOpenNewLecture()}
          className="absolute bottom-16 right-4 w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
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