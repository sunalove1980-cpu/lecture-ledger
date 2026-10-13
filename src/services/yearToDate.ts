import type { Lecture } from '../types/lecture';

const koreaDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function getKoreanToday(now = new Date()): string {
  const parts = koreaDate.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isCalendarDate(value: string): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

// Read-only projection of the complete ledger. Never use the selected month's
// records or paidDate: this is earned lecture fees by lecture date, not cash flow.
export function summarizeYearToDate(lectures: readonly Lecture[], today: string) {
  const startDate = `${today.slice(0, 4)}-01-01`;
  let paidEarnings = 0;
  let pendingEarnings = 0;
  let invalidFeeCount = 0;

  for (const lecture of lectures) {
    if (!isCalendarDate(lecture.date) || lecture.date < startDate || lecture.date > today) continue;
    // Preserve finite legacy amounts, including decimals and signed adjustments.
    // Do not coerce malformed values or apply the Calendar import's integer rule
    // retroactively to saved records. The UI discloses excluded fees.
    if (typeof lecture.totalFee !== 'number' || !Number.isFinite(lecture.totalFee)) {
      invalidFeeCount++;
      continue;
    }
    if (lecture.isPaid) paidEarnings += lecture.totalFee;
    else pendingEarnings += lecture.totalFee;
  }

  return { startDate, endDate: today, totalEarnings: paidEarnings + pendingEarnings, paidEarnings, pendingEarnings, invalidFeeCount };
}
