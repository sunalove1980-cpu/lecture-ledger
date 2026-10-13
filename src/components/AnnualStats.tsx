import React, { useEffect, useMemo, useState } from 'react';
import type { Lecture } from '../types/lecture';
import { getKoreanToday, summarizeAnnualTotals } from '../services/annualTotals';

const won = (value: number) => `₩${value.toLocaleString('ko-KR')}`;

export const AnnualStats: React.FC<{ lectures: readonly Lecture[] }> = ({ lectures }) => {
  const [today, setToday] = useState(() => getKoreanToday());

  useEffect(() => {
    const updateToday = () => setToday(getKoreanToday());
    const onVisible = () => {
      if (document.visibilityState === 'visible') updateToday();
    };
    // Refresh an open annual summary at Korea midnight, and after device sleep.
    const nextMidnight = Date.parse(`${today}T00:00:00+09:00`) + 24 * 60 * 60 * 1000;
    const timer = window.setTimeout(updateToday, Math.max(0, nextMidnight - Date.now()) + 20);
    window.addEventListener('focus', updateToday);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', updateToday);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [today]);

  const summary = useMemo(() => summarizeAnnualTotals(lectures, today), [lectures, today]);

  return (
    <section aria-labelledby="annual-total-title" className="mb-6 border border-[#d4d0c4] bg-[#e9e4d7] p-5 sm:mb-8 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2 md:items-end">
        <div className="min-w-0">
          <h2 id="annual-total-title" className="text-base font-black tracking-[-0.04em]">올해 강의료 합계</h2>
          <p className="mt-1 text-xs leading-5 text-[#55564f]">
            {summary.startDate.replaceAll('-', '.')} ~ {summary.endDate.replaceAll('-', '.')} · 올해 전체
          </p>
          <p className="mt-3 break-all text-3xl font-black tracking-[-0.06em] sm:text-4xl">{won(summary.totalEarnings)}</p>
        </div>
        <dl className="grid min-w-0 grid-cols-2 gap-4 border-t border-[#cbc6b9] pt-4">
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-[#55564f]">수령액</dt>
            <dd className="mt-1 break-all text-lg font-black">{won(summary.paidEarnings)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-[#55564f]">미입금액</dt>
            <dd className="mt-1 break-all text-lg font-black text-[#9b513e]">{won(summary.pendingEarnings)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#55564f]">강의일 기준 · 한국 시간 · 예정 강의 포함 · 월 선택·검색과 무관</p>
      <p className="text-xs leading-5 text-[#55564f]">수령액·미입금액은 위 기간 강의의 현재 입금 상태 기준입니다.</p>
      {summary.invalidFeeCount > 0 && (
        <p className="mt-2 text-xs leading-5 text-[#9b513e]">금액을 확인할 수 없는 {summary.invalidFeeCount}건은 합계에서 제외했습니다.</p>
      )}
    </section>
  );
};
