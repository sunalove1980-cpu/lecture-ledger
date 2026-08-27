import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { Lecture } from '../types/lecture';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MonthlyChartProps {
  allLectures: Lecture[];
  currentMonth: Date;
  onSelectMonth: (date: Date) => void;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({
  allLectures,
  currentMonth,
  onSelectMonth,
}) => {
  // Generate data for the last 6 months
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const targetMonth = subMonths(currentMonth, i);
    const start = startOfMonth(targetMonth);
    const end = endOfMonth(targetMonth);
    const monthKey = format(targetMonth, 'yyyy-MM');
    const label = format(targetMonth, 'M월', { locale: ko });

    const monthLectures = allLectures.filter(lec => {
      const lecDate = new Date(lec.date);
      return isWithinInterval(lecDate, { start, end });
    });

    const totalFee = monthLectures.reduce((sum, l) => sum + (l.totalFee || 0), 0);
    const totalHours = monthLectures.reduce((sum, l) => sum + (l.durationHours || 0), 0);
    const paidFee = monthLectures.filter(l => l.isPaid).reduce((sum, l) => sum + (l.totalFee || 0), 0);
    const pendingFee = monthLectures.filter(l => !l.isPaid).reduce((sum, l) => sum + (l.totalFee || 0), 0);

    chartData.push({
      key: monthKey,
      label,
      date: targetMonth,
      totalFee: Math.round(totalFee / 10000), // in 10,000 KRW (만 원)
      rawTotalFee: totalFee,
      paidFee: Math.round(paidFee / 10000),
      pendingFee: Math.round(pendingFee / 10000),
      hours: totalHours,
      count: monthLectures.length,
      isCurrent: format(targetMonth, 'yyyy-MM') === format(currentMonth, 'yyyy-MM'),
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[170px]">
          <div className="font-bold text-sm text-indigo-300 border-b border-slate-700/60 pb-1 flex items-center justify-between">
            <span>{data.key} ({label})</span>
            <span className="text-[11px] font-normal text-slate-400">{data.count}회 강의</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">총 강의료:</span>
            <span className="font-bold text-white text-sm">
              ₩ {data.rawTotalFee.toLocaleString('ko-KR')}
            </span>
          </div>
          <div className="flex items-center justify-between text-emerald-400">
            <span>• 입금 완료:</span>
            <span className="font-semibold">
              ₩ {(data.paidFee * 10000).toLocaleString('ko-KR')}
            </span>
          </div>
          {data.pendingFee > 0 && (
            <div className="flex items-center justify-between text-amber-300">
              <span>• 미입금:</span>
              <span className="font-semibold">
                ₩ {(data.pendingFee * 10000).toLocaleString('ko-KR')}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-blue-300 border-t border-slate-800 pt-1">
            <span>총 시간:</span>
            <span className="font-medium">{data.hours}시간</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              월별 강의료 추이
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-md">
              최근 6개월
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            막대를 클릭하면 해당 월의 상세 내역으로 즉시 이동합니다 (단위: 만 원)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-indigo-500"></span>
            <span>입금 완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-400"></span>
            <span>입금 대기</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length) {
                const targetDate = state.activePayload[0].payload.date;
                onSelectMonth(targetDate);
              }
            }}
            className="cursor-pointer"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              tickLine={false} 
              axisLine={{ stroke: '#e2e8f0' }} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit="만"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar 
              dataKey="paidFee" 
              name="입금 완료" 
              stackId="a" 
              fill="#6366f1" 
              radius={[0, 0, 0, 0]} 
            />
            <Bar 
              dataKey="pendingFee" 
              name="입금 대기" 
              stackId="a" 
              fill="#fbbf24" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};