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
        <div className="bg-slate-800 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1 min-w-[140px]">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100 border-b border-slate-700 pb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="truncate">{data.agency}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-400">강의료:</span>
            <span className="font-bold text-white">₩ {data.totalFee.toLocaleString('ko-KR')}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>비중:</span>
            <span className="font-semibold text-sky-300">{data.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (agencyStats.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center min-h-[260px] text-center">
        <Building2 className="w-10 h-10 text-slate-300 mb-2" />
        <h4 className="text-xs font-bold text-slate-700">등록된 강의가 없습니다</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          강의를 등록하면 업체별 실적 분석이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            위탁 / 중개 업체별 분석
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            가장 많은 수익이 발생한 위탁 업체 순위
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
          총 {agencyStats.length}곳
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        
        {/* Doughnut Chart */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-40 h-40 sm:w-44 sm:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agencyStats}
                  dataKey="totalFee"
                  nameKey="agency"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-medium text-slate-400">1위 점유율</span>
            <span className="text-base font-extrabold text-slate-800">
              {agencyStats[0]?.percentage || 0}%
            </span>
          </div>
        </div>

        {/* Agency Breakdown List */}
        <div className="sm:col-span-7 space-y-2">
          {agencyStats.map((stat, idx) => (
            <div
              key={stat.agency}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 transition-colors border border-slate-100"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  idx === 0 ? 'bg-amber-100 text-amber-800' :
                  idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {idx + 1}
                </span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stat.color }}></span>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {stat.agency}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {stat.lectureCount}회 · {stat.totalHours}시간
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <div className="text-xs font-bold text-slate-800">
                  ₩ {stat.totalFee.toLocaleString('ko-KR')}
                </div>
                <div className="text-[10px] font-semibold text-sky-600">
                  {stat.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};