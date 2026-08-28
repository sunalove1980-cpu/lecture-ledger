import React from 'react';
import { ArrowUpRight, CircleCheck, Clock3, Presentation } from 'lucide-react';
import type { Lecture } from '../types/lecture';

interface DashboardStatsProps { lectures: Lecture[]; prevMonthTotal: number; }
const won = (value: number) => `₩${value.toLocaleString('ko-KR')}`;

export const DashboardStats: React.FC<DashboardStatsProps> = ({ lectures, prevMonthTotal }) => {
  const totalEarnings = lectures.reduce((sum, item) => sum + (item.totalFee || 0), 0);
  const paidEarnings = lectures.filter(item => item.isPaid).reduce((sum, item) => sum + (item.totalFee || 0), 0);
  const pendingEarnings = totalEarnings - paidEarnings;
  const totalHours = lectures.reduce((sum, item) => sum + (item.durationHours || 0), 0);
  const avgHourlyRate = totalHours ? Math.round(totalEarnings / totalHours) : 0;
  const paidRate = totalEarnings ? Math.round((paidEarnings / totalEarnings) * 100) : 0;
  const diffPercent = prevMonthTotal ? Math.round(((totalEarnings - prevMonthTotal) / prevMonthTotal) * 100) : 0;
  const pendingCount = lectures.filter(item => !item.isPaid).length;

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-12">
      <article className="relative min-h-[250px] overflow-hidden bg-[#171916] p-6 text-white md:col-span-7 sm:p-8">
        <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full border-[44px] border-[#d8c7a8]/10" />
        <div className="relative flex h-full flex-col justify-between gap-12">
          <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold tracking-[0.18em] text-[#a8aaa2]">MONTHLY REVENUE</p><p className="mt-2 text-sm font-semibold text-[#d4d5cf]">이번 달 강의 수익</p></div><ArrowUpRight className="h-5 w-5 text-[#d8c7a8]" /></div>
          <div><p className="break-all text-[clamp(2.15rem,6vw,4.2rem)] font-black leading-none tracking-[-0.075em]">{won(totalEarnings)}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs"><span className="text-[#92948d]">지난달 {won(prevMonthTotal)}</span>{prevMonthTotal > 0 && <span className={diffPercent >= 0 ? 'font-bold text-[#d8c7a8]' : 'font-bold text-[#d79a88]'}>{diffPercent >= 0 ? '+' : ''}{diffPercent}%</span>}</div>
          </div>
        </div>
      </article>
      <article className="flex min-h-[250px] flex-col justify-between border border-[#d4d0c4] bg-[#e9e4d7] p-6 md:col-span-5 sm:p-8">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold tracking-[0.18em] text-[#797870]">SETTLEMENT</p><h2 className="mt-2 text-lg font-black tracking-[-0.04em] text-[#171916]">정산 진행률</h2></div><span className="text-4xl font-black tracking-[-0.06em] text-[#171916]">{paidRate}%</span></div>
        <div><div className="mb-5 h-2 overflow-hidden bg-[#d5d0c4]"><div className="h-full bg-[#171916] transition-all duration-700" style={{ width: `${paidRate}%` }} /></div>
          <div className="grid grid-cols-2 gap-5 border-t border-[#cbc6b9] pt-4"><div><p className="flex items-center gap-1.5 text-[10px] font-bold text-[#77766e]"><CircleCheck className="h-3.5 w-3.5" /> 입금 완료</p><p className="mt-1.5 text-sm font-black text-[#171916]">{won(paidEarnings)}</p></div><div><p className="text-[10px] font-bold text-[#77766e]">입금 대기</p><p className="mt-1.5 text-sm font-black text-[#9b513e]">{won(pendingEarnings)}</p></div></div>
        </div>
      </article>
      <article className="border border-[#d4d0c4] bg-[#f8f6ef] p-5 md:col-span-4"><div className="flex items-center justify-between text-[#77766e]"><span className="text-[10px] font-bold tracking-[0.14em]">LECTURE HOURS</span><Clock3 className="h-4 w-4" /></div><div className="mt-7 flex items-end justify-between"><p className="text-4xl font-black tracking-[-0.06em] text-[#171916]">{totalHours}<span className="ml-1 text-sm">h</span></p><p className="text-right text-[10px] leading-4 text-[#77766e]">시간당 평균<br/><strong className="text-xs text-[#171916]">{won(avgHourlyRate)}</strong></p></div></article>
      <article className="border border-[#d4d0c4] bg-[#f8f6ef] p-5 md:col-span-4"><div className="flex items-center justify-between text-[#77766e]"><span className="text-[10px] font-bold tracking-[0.14em]">SESSIONS</span><Presentation className="h-4 w-4" /></div><div className="mt-7 flex items-end justify-between"><p className="text-4xl font-black tracking-[-0.06em] text-[#171916]">{lectures.length}<span className="ml-1 text-sm">회</span></p><p className="text-right text-[10px] leading-4 text-[#77766e]">온라인 {lectures.filter(item => item.locationType === 'online').length}<br/>오프라인 {lectures.filter(item => item.locationType === 'offline').length}</p></div></article>
      <article className="flex items-center justify-between bg-[#c7b7a2] p-5 md:col-span-4"><div><p className="text-[10px] font-black tracking-[0.14em] text-[#655a4d]">NEXT ACTION</p><p className="mt-2 text-base font-black tracking-[-0.04em] text-[#171916]">미정산 {pendingCount}건 확인하기</p></div><ArrowUpRight className="h-6 w-6 text-[#171916]" /></article>
    </section>
  );
};
