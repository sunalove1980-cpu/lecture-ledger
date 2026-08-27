import React, { useState, useEffect, useMemo } from 'react';
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
  PlusCircle
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
  
  // Google config
  const [googleConfig, setGoogleConfig] = useState<GoogleCalendarConfig>(getGoogleConfig());

  // Load lectures on mount
  useEffect(() => {
    const loaded = getLectures();
    setLectures(loaded);
  }, []);

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
    
    // Push to Google Calendar if requested & configured
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
    if (window.confirm('정말 이 강의 일정을 삭제하시겠습니까?')) {
      deleteLecture(id);
      setLectures(getLectures());
    }
  };

  const handleTogglePayment = (id: string) => {
    const updated = togglePaymentStatus(id);
    if (updated && updated.isPaid) {
      // Fire celebratory confetti!
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
    setLectures(getLectures());
  };

  const handleResetData = () => {
    if (window.confirm('예시 샘플 데이터로 초기화하시겠습니까? 기존 데이터는 대체됩니다.')) {
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
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans pb-20 md:pb-10">
      
      {/* Top Sticky Header */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onOpenNewLectureModal={() => handleOpenNewLecture()}
        onOpenGoogleSyncModal={() => setIsGoogleModalOpen(true)}
        onExportCsv={handleExportCsv}
        onResetData={handleResetData}
        isGoogleConnected={googleConfig.isConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Desktop View Switcher Tabs */}
        <div className="flex items-center justify-between">
          <div className="inline-flex p-1 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>종합 대시보드</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>강의 캘린더</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'list'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>강의 목록 ({currentMonthLectures.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
              <span>업체별 통계</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center text-xs text-slate-500 gap-1.5 font-medium">
            <span>현재 기준:</span>
            <span className="font-bold text-slate-800">{format(currentMonth, 'yyyy년 M월')}</span>
          </div>
        </div>

        {/* 1. Key Metrics Stats Card (Always visible or in dashboard) */}
        <DashboardStats
          lectures={currentMonthLectures}
          prevMonthTotal={prevMonthTotalFee}
        />

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Row: Monthly Chart + Agency Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

            {/* Middle Row: Interactive Calendar */}
            <LectureCalendar
              currentMonth={currentMonth}
              lectures={currentMonthLectures}
              onSelectLecture={handleEditLecture}
              onAddNewAtDate={handleOpenNewLecture}
            />

            {/* Bottom Row: Detailed Lecture List */}
            <LectureList
              lectures={currentMonthLectures}
              onEdit={handleEditLecture}
              onDelete={handleDeleteLecture}
              onTogglePaid={handleTogglePayment}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
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
          <div className="space-y-6">
            <LectureList
              lectures={lectures} // Show all lectures in list tab
              onEdit={handleEditLecture}
              onDelete={handleDeleteLecture}
              onTogglePaid={handleTogglePayment}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>홈</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span>캘린더</span>
        </button>

        {/* Center Big Add Button */}
        <button
          onClick={() => handleOpenNewLecture()}
          className="w-12 h-12 -mt-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 active:scale-95 transition-transform"
        >
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            activeTab === 'list' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <ListFilter className="w-5 h-5" />
          <span>목록</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-500'
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