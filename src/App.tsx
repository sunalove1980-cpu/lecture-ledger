import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getLectures, 
  saveLecture, 
  deleteLecture, 
  togglePaymentStatus, 
  resetToSampleData,
  getGoogleConfig,
  saveGoogleConfig
} from './services/storage';
import { exportToCsv } from './services/exportCsv';
import { createGoogleCalendarEvent } from './services/googleCalendar';
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
  PieChart as PieChartIcon,
  Plus
} from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from 'date-fns';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'list' | 'analytics'>('dashboard');
  
  // Modals
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [newLectureDefaultDate, setNewLectureDefaultDate] = useState<string | undefined>(undefined);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  
  // Google config & Auto-sync state
  const [googleConfig, setGoogleConfig] = useState<GoogleCalendarConfig>(getGoogleConfig());
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // Auto-sync / load data function
  const refreshDataFromStorage = useCallback(() => {
    setIsAutoSyncing(true);
    const loaded = getLectures();
    setLectures(loaded);
    setTimeout(() => {
      setIsAutoSyncing(false);
    }, 300);
  }, []);

  // On App Launch (Mount) & Window Focus / Tab Return (Mobile PWA & Desktop)
  useEffect(() => {
    refreshDataFromStorage();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDataFromStorage();
      }
    };

    window.addEventListener('focus', refreshDataFromStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshDataFromStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDataFromStorage]);

  // Filter lectures for the currently selected month
  const currentMonthLectures = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return lectures.filter((lec) => {
      const d = new Date(lec.date);
      return isWithinInterval(d, { start, end });
    });
  }, [lectures, currentMonth]);

  // Previous month total fee for comparison
  const prevMonthTotalFee = useMemo(() => {
    const prevMonth = subMonths(currentMonth, 1);
    const start = startOfMonth(prevMonth);
    const end = endOfMonth(prevMonth);
    const prevLectures = lectures.filter((lec) => {
      const d = new Date(lec.date);
      return isWithinInterval(d, { start, end });
    });
    return prevLectures.reduce((sum, l) => sum + (l.totalFee || 0), 0);
  }, [lectures, currentMonth]);

  // Handlers
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
    lectureData: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    syncToGCal?: boolean
  ) => {
    const saved = saveLecture(lectureData);
    
    if (syncToGCal && googleConfig.isConnected) {
      try {
        const eventId = await createGoogleCalendarEvent(saved, googleConfig.calendarId);
        if (eventId) {
          saved.googleCalendarEventId = eventId;
          saveLecture(saved);
        }
      } catch (err) {
        console.error('Failed to sync to Google Calendar:', err);
      }
    }

    setLectures(getLectures());
  };

  const handleDeleteLecture = (id: string) => {
    if (window.confirm('이 강의 일정을 삭제하시겠습니까?')) {
      deleteLecture(id);
      setLectures(getLectures());
    }
  };

  const handleTogglePayment = (id: string) => {
    const updated = togglePaymentStatus(id);
    if (updated && updated.isPaid) {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.8 },
      });
    }
    setLectures(getLectures());
  };

  const handleResetData = () => {
    if (window.confirm('예시 샘플 데이터로 복원하시겠습니까?')) {
      const reset = resetToSampleData();
      setLectures(reset);
    }
  };

  const handleExportCsv = () => {
    const monthLabel = format(currentMonth, 'yyyy년_MM월');
    exportToCsv(currentMonthLectures, `강의료정산_${monthLabel}`);
  };

  const handleSaveGoogleConfig = (newConfig: GoogleCalendarConfig) => {
    setGoogleConfig(newConfig);
    saveGoogleConfig(newConfig);
  };

  const handleGoogleSyncComplete = (updatedLectures: Lecture[]) => {
    setLectures(updatedLectures);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans pb-24 md:pb-12">
      
      {/* Top Header */}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Desktop View Switcher Tabs */}
        <div className="flex items-center justify-between">
          <div className="inline-flex p-1 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>종합 대시보드</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'calendar'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>강의 캘린더</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'list'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>강의 목록 ({currentMonthLectures.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'analytics'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
              <span>업체별 통계</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center text-xs text-slate-400 gap-1 font-medium">
            <span>자동 갱신 기준:</span>
            <span className="font-bold text-slate-700">{format(currentMonth, 'yyyy년 M월')}</span>
          </div>
        </div>

        {/* 1. Key Metrics Stats Cards */}
        <DashboardStats
          lectures={currentMonthLectures}
          prevMonthTotal={prevMonthTotalFee}
        />

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <MonthlyChart
                  allLectures={lectures}
                  currentMonth={currentMonth}
                  onSelectMonth={setCurrentMonth}
                />
              </div>
              <div className="lg:col-span-5">
                <AgencyChart lectures={currentMonthLectures} />
              </div>
            </div>

            <LectureCalendar
              currentMonth={currentMonth}
              lectures={currentMonthLectures}
              onSelectLecture={handleEditLecture}
              onAddNewAtDate={handleOpenNewLecture}
            />

            <LectureList
              lectures={currentMonthLectures}
              onEdit={handleEditLecture}
              onDelete={handleDeleteLecture}
              onTogglePaid={handleTogglePayment}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-5">
            <LectureCalendar
              currentMonth={currentMonth}
              lectures={currentMonthLectures}
              onSelectLecture={handleEditLecture}
              onAddNewAtDate={handleOpenNewLecture}
            />
            <LectureList
              lectures={currentMonthLectures}
              onEdit={handleEditLecture}
              onDelete={handleDeleteLecture}
              onTogglePaid={handleTogglePayment}
            />
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-5">
            <LectureList
              lectures={lectures}
              onEdit={handleEditLecture}
              onDelete={handleDeleteLecture}
              onTogglePaid={handleTogglePayment}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6">
                <AgencyChart lectures={currentMonthLectures} />
              </div>
              <div className="lg:col-span-6">
                <MonthlyChart
                  allLectures={lectures}
                  currentMonth={currentMonth}
                  onSelectMonth={setCurrentMonth}
                />
              </div>
            </div>
            <LectureList
              lectures={currentMonthLectures}
              onEdit={handleEditLecture}
              onDelete={handleDeleteLecture}
              onTogglePaid={handleTogglePayment}
            />
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (Pastel & Clean) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            activeTab === 'dashboard' ? 'text-sky-600' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>홈</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            activeTab === 'calendar' ? 'text-sky-600' : 'text-slate-400'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span>캘린더</span>
        </button>

        {/* Center Floating Plus Button (Sky Blue Pastel) */}
        <button
          onClick={() => handleOpenNewLecture()}
          className="w-11 h-11 -mt-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-200 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            activeTab === 'list' ? 'text-sky-600' : 'text-slate-400'
          }`}
        >
          <ListFilter className="w-5 h-5" />
          <span>목록</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            activeTab === 'analytics' ? 'text-sky-600' : 'text-slate-400'
          }`}
        >
          <PieChartIcon className="w-5 h-5" />
          <span>통계</span>
        </button>
      </div>

      {/* Modals */}
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
        currentLectures={lectures}
        onSyncComplete={handleGoogleSyncComplete}
      />

    </div>
  );
};

export default App;