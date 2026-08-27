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
  
  const diffPercent = prevMonthTotal > 0 
    ? Math.round(((totalEarnings - prevMonthTotal) / prevMonthTotal) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      
      {/* 1. Monthly Revenue */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:shadow-sm transition-all relative overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-500 tracking-tight">
            이번 달 총 강의료
          </span>
          <div className="w-8 h-8 rounded-xl bg-gray-50 text-blue-600 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            ₩ {totalEarnings.toLocaleString('ko-KR')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {prevMonthTotal > 0 && (
            <span className={`inline-flex items-center font-bold ${diffPercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp className={`w-3.5 h-3.5 mr-0.5 ${diffPercent < 0 ? 'rotate-180' : ''}`} />
              {diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`}
            </span>
          )}
          <span className="text-gray-400 text-[11px]">
            {prevMonthTotal > 0 ? '전월 대비' : '총 정산 예정액'}
          </span>
        </div>
      </div>

      {/* 2. Received vs Pending */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:shadow-sm transition-all relative overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-500 tracking-tight">
            입금 및 정산 현황
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              입금 완료
            </span>
            <span className="font-bold text-emerald-700">
              ₩ {paidEarnings.toLocaleString('ko-KR')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              입금 대기
            </span>
            <span className="font-bold text-amber-700">
              ₩ {pendingEarnings.toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden flex">
          <div 
            className="bg-emerald-400 h-full transition-all duration-500"
            style={{ width: `${totalEarnings > 0 ? (paidEarnings / totalEarnings) * 100 : 0}%` }}
          ></div>
          <div 
            className="bg-amber-300 h-full transition-all duration-500"
            style={{ width: `${totalEarnings > 0 ? (pendingEarnings / totalEarnings) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Total Hours & Average Hourly Rate */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:shadow-sm transition-all relative overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-500 tracking-tight">
            총 강의 시간
          </span>
          <div className="w-8 h-8 rounded-xl bg-gray-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            {totalHours}
          </span>
          <span className="text-xs font-medium text-gray-500">시간</span>
        </div>
        <div className="text-[11px] text-gray-500 flex items-center gap-1">
          <span>시간당 평균</span>
          <span className="font-bold text-blue-600">
            ₩ {avgHourlyRate > 0 ? avgHourlyRate.toLocaleString('ko-KR') : 0}
          </span>
        </div>
      </div>

      {/* 4. Total Sessions & Format Breakdown */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:shadow-sm transition-all relative overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-500 tracking-tight">
            진행 강의 수
          </span>
          <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
            <Presentation className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            {lectureCount}
          </span>
          <span className="text-xs font-medium text-gray-500">건</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Laptop className="w-3 h-3 text-gray-400" /> 온라인 {onlineCount}
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-0.5">
            <Building2 className="w-3 h-3 text-gray-400" /> 오프라인 {offlineCount}
          </span>
        </div>
      </div>

    </div>
  );
};