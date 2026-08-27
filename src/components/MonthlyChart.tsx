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
      totalFee: Math.round(totalFee / 10000),
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
        <div className="bg-slate-800 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 min-w-[160px]">
          <div className="font-bold text-xs text-sky-300 border-b border-slate-700 pb-1 flex items-center justify-between">
            <span>{data.key} ({label})</span>
            <span className="text-[11px] font-normal text-slate-400">{data.count}회</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">총 강의료:</span>
            <span className="font-bold text-white">
              ₩ {data.rawTotalFee.toLocaleString('ko-KR')}
            </span>
          </div>
          <div className="flex items-center justify-between text-teal-300">
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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              월별 강의료 추이
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-50 text-sky-700 rounded-md">
              최근 6개월
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            막대를 클릭하면 해당 월로 이동합니다 (단위: 만 원)
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-400"></span>
            <span>입금 완료</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-300"></span>
            <span>입금 대기</span>
          </div>
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              unit="만"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar 
              dataKey="paidFee" 
              name="입금 완료" 
              stackId="a" 
              fill="#38bdf8" 
              radius={[0, 0, 0, 0]} 
            />
            <Bar 
              dataKey="pendingFee" 
              name="입금 대기" 
              stackId="a" 
              fill="#fcd34d" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};