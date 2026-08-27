import React from 'react';
import { 
  Coins, 
  CheckCircle2, 
  Clock, 
  Presentation, 
  Laptop, 
  Building2, 
  TrendingUp 
} from 'lucide-react';
import type { Lecture } from '../types/lecture';


interface DashboardStatsProps {
  lectures: Lecture[];
  prevMonthTotal: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  lectures,
  prevMonthTotal,
}) => {
  const totalEarnings = lectures.reduce((sum, l) => sum + (l.totalFee || 0), 0);
  const paidEarnings = lectures.filter(l => l.isPaid).reduce((sum, l) => sum + (l.totalFee || 0), 0);
  const pendingEarnings = lectures.filter(l => !l.isPaid).reduce((sum, l) => sum + (l.totalFee || 0), 0);
  const totalHours = lectures.reduce((sum, l) => sum + (l.durationHours || 0), 0);
  const lectureCount = lectures.length;
  
  const onlineCount = lectures.filter(l => l.locationType === 'online').length;
  const offlineCount = lectures.filter(l => l.locationType === 'offline').length;

  const avgHourlyRate = totalHours > 0 ? Math.round(totalEarnings / totalHours) : 0;
  
  // Percent change compared to previous month
  const diffPercent = prevMonthTotal > 0 
    ? Math.round(((totalEarnings - prevMonthTotal) / prevMonthTotal) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      
      {/* 1. Monthly Revenue */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            이번 달 총 강의료
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ₩ {totalEarnings.toLocaleString('ko-KR')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {prevMonthTotal > 0 && (
            <span className={`inline-flex items-center font-medium ${diffPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <TrendingUp className={`w-3.5 h-3.5 mr-0.5 ${diffPercent < 0 ? 'rotate-180' : ''}`} />
              {diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`}
            </span>
          )}
          <span className="text-slate-400">
            {prevMonthTotal > 0 ? '전월 대비' : '이번 달 총 누적액'}
          </span>
        </div>
      </div>

      {/* 2. Received vs Pending */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            정산 및 입금 현황
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              입금 완료
            </span>
            <span className="text-sm font-bold text-emerald-700">
              ₩ {paidEarnings.toLocaleString('ko-KR')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              입금 대기
            </span>
            <span className="text-sm font-bold text-amber-700">
              ₩ {pendingEarnings.toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden flex">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${totalEarnings > 0 ? (paidEarnings / totalEarnings) * 100 : 0}%` }}
          ></div>
          <div 
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${totalEarnings > 0 ? (pendingEarnings / totalEarnings) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Total Hours & Average Hourly Rate */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            총 강의 시간
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalHours}
          </span>
          <span className="text-sm font-medium text-slate-500">시간</span>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span>시간당 평균</span>
          <span className="font-semibold text-blue-600">
            ₩ {avgHourlyRate > 0 ? avgHourlyRate.toLocaleString('ko-KR') : 0}
          </span>
        </div>
      </div>

      {/* 4. Total Sessions & Format Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            진행 강의 수
          </span>
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Presentation className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {lectureCount}
          </span>
          <span className="text-sm font-medium text-slate-500">건</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Laptop className="w-3.5 h-3.5 text-slate-400" />
            온라인 {onlineCount}
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            오프라인 {offlineCount}
          </span>
        </div>
      </div>

    </div>
  );
};