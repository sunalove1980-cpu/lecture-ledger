import type { Lecture } from '../types/lecture';
import { fetchCalendarEvents, parseGEventsToLectures } from './googleCalendar.ts';
import { appendCalendarLectures } from './storage.ts';

export async function syncLumiCalendar(token: string, calendarId: string) {
  // Complete every page and validate the entire eligible batch before any write.
  const events = await fetchCalendarEvents(token, calendarId);
  const candidates = parseGEventsToLectures(events);
  if (!navigator.locks) throw new Error('안전한 동기화를 위해 최신 브라우저의 HTTPS 앱을 사용해 주세요.');
  const result = await navigator.locks.request('lecture-ledger-calendar-append', () => appendCalendarLectures(candidates));
  return { ...result, excludedCount: events.length - candidates.length };
}

export interface CalendarSyncResult {
  lectures: Lecture[];
  addedCount: number;
  duplicateCount: number;
  excludedCount: number;
}

export function formatSyncSummary(result: CalendarSyncResult): string {
  return `동기화 완료! 신규 ${result.addedCount}건 추가, 중복 ${result.duplicateCount}건 건너뜀, 대상 외 ${result.excludedCount}건 제외. 기존 기록은 변경하지 않았습니다.`;
}
