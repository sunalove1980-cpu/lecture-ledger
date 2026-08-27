import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Building2 } from 'lucide-react';
import type { Lecture, AgencyStat } from '../types/lecture';

import { getAgencyColor } from '../services/storage';

interface AgencyChartProps {
  lectures: Lecture[];
}

export const AgencyChart: React.FC<AgencyChartProps> = ({ lectures }) => {
  const totalMonthFee = lectures.reduce((sum, l) => sum + (l.totalFee || 0), 0);

  // Group lectures by agency
  const agencyMap: Record<string, { totalFee: number; totalHours: number; count: number }> = {};
  
  lectures.forEach(l => {
    const agencyName = (l.agency && l.agency.trim()) || '기타 / 직접 출강';
    if (!agencyMap[agencyName]) {
      agencyMap[agencyName] = { totalFee: 0, totalHours: 0, count: 0 };
    }
    agencyMap[agencyName].totalFee += l.totalFee || 0;
    agencyMap[agencyName].totalHours += l.durationHours || 0;
    agencyMap[agencyName].count += 1;
  });

  const agencyStats: AgencyStat[] = Object.entries(agencyMap)
    .map(([agency, data]) => ({
      agency,
      totalFee: data.totalFee,
      totalHours: data.totalHours,
      lectureCount: data.count,
      percentage: totalMonthFee > 0 ? Math.round((data.totalFee / totalMonthFee) * 100) : 0,
      color: getAgencyColor(agency),
    }))
    .sort((a, b) => b.totalFee - a.totalFee);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: AgencyStat = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 min-w-[150px]">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100 border-b border-slate-700/60 pb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.agency}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-400">강의료:</span>
            <span className="font-bold text-white">₩ {data.totalFee.toLocaleString('ko-KR')}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>비중:</span>
            <span className="font-semibold text-indigo-300">{data.percentage}%</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>강의 횟수:</span>
            <span>{data.lectureCount}회 ({data.totalHours}시간)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (agencyStats.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center">
        <Building2 className="w-12 h-12 text-slate-300 mb-3" />
        <h4 className="text-sm font-semibold text-slate-700">등록된 강의가 없습니다</h4>
        <p className="text-xs text-slate-400 mt-1">
          강의를 등록하면 위탁/중개 업체별 실적 분석이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            위탁 / 중개 업체별 분석
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            어떤 업체를 통해 가장 많은 강의와 수익이 발생했는지 확인하세요
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
          총 {agencyStats.length}개 기관
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Doughnut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-48 h-48 sm:w-56 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agencyStats}
                  dataKey="totalFee"
                  nameKey="agency"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {agencyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Inner summary text inside donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-medium text-slate-400">1위 업체 비중</span>
            <span className="text-lg font-bold text-slate-800">
              {agencyStats[0]?.percentage || 0}%
            </span>
          </div>
        </div>

        {/* Agency Breakdown List */}
        <div className="lg:col-span-7 space-y-2.5">
          {agencyStats.map((stat, idx) => (
            <div
              key={stat.agency}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-100"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  idx === 0 ? 'bg-amber-100 text-amber-800' :
                  idx === 1 ? 'bg-slate-200 text-slate-700' :
                  idx === 2 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {idx + 1}
                </span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }}></span>
                <div className="truncate">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                    {stat.agency}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {stat.lectureCount}회 · {stat.totalHours}시간
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                  ₩ {stat.totalFee.toLocaleString('ko-KR')}
                </div>
                <div className="text-[11px] font-medium text-indigo-600">
                  점유율 {stat.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};