import type { Lecture, GoogleCalendarConfig } from '../types/lecture';
import type { CalendarLecture } from './googleCalendar';

const STORAGE_KEY = 'lecture_fee_manager_lectures_v1';
const GOOGLE_CONFIG_KEY = 'lecture_fee_manager_google_config_v2';

export const POPULAR_AGENCIES = [
  '패스트캠퍼스',
  '러닝스푼즈',
  '멀티캠퍼스',
  '원티드 프리온보딩',
  '멋쟁이사자처럼',
  '인프런',
  '삼성 청년 SW 아카데미(SSAFY)',
  '기업 직접 출강',
  '대학교/공공기관',
];

// 차트 전용 구분 색상 (UI 크롬에는 사용하지 않음)
export const AGENCY_COLORS: Record<string, string> = {
  '패스트캠퍼스': '#3b82f6',
  '러닝스푼즈': '#6366f1',
  '멀티캠퍼스': '#10b981',
  '원티드 프리온보딩': '#8b5cf6',
  '멋쟁이사자처럼': '#f59e0b',
  '인프런': '#06b6d4',
  '삼성 청년 SW 아카데미(SSAFY)': '#ec4899',
  '기업 직접 출강': '#64748b',
  '대학교/공공기관': '#14b8a6',
};

export const DEFAULT_COLOR = '#64748b';

export function getAgencyColor(agencyName: string): string {
  if (AGENCY_COLORS[agencyName]) {
    return AGENCY_COLORS[agencyName];
  }
  const palette = ['#3b82f6', '#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < agencyName.length; i++) {
    hash = agencyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// ─── CRUD ─────────────────────────────────────────────

export function getLectures(): Lecture[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse lectures from localStorage:', err);
    return [];
  }
}

// Keep the v1 array and all legacy/unknown fields. Never use getLectures' UI
// fallback here: corrupt or incompatible data must stop the import.
export const CALENDAR_BACKUP_KEY = `${STORAGE_KEY}_before_lumi_append_v1`;
export function appendCalendarLectures(candidates: CalendarLecture[]) {
  const original = localStorage.getItem(STORAGE_KEY);
  const existing = original === null ? [] : JSON.parse(original);
  if (!Array.isArray(existing) || existing.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error('기존 기록을 읽을 수 없어 동기화를 중단했습니다.');
  }
  const next: Lecture[] = [...existing];
  let duplicateCount = 0;
  const normalize = (value: unknown) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  for (const candidate of candidates) {
    if (!candidate.googleCalendarEventId || !candidate.title || !Number.isSafeInteger(candidate.totalFee)
      || candidate.totalFee < 0 || !Number.isFinite(candidate.durationHours) || candidate.durationHours <= 0) {
      throw new Error('추가할 강의 데이터가 올바르지 않습니다.');
    }
    const duplicate = next.some((lecture) =>
      lecture.googleCalendarEventId === candidate.googleCalendarEventId
      || (lecture.date === candidate.date && lecture.startTime === candidate.startTime
        && lecture.endTime === candidate.endTime && normalize(lecture.title) === normalize(candidate.title)
        && normalize(lecture.agency) === normalize(candidate.agency)),
    );
    if (duplicate) { duplicateCount++; continue; }
    const now = new Date().toISOString();
    next.push({
      ...candidate, id: `lec_${crypto.randomUUID()}`, createdAt: now, updatedAt: now,
      isPaid: false, locationType: candidate.locationDetail ? 'offline' : 'online',
    });
  }
  const addedCount = next.length - existing.length;
  if (addedCount) {
    // Preserve original JSON text too (including unknown numeric fields), appending
    // only inside the existing array. Validate before the single atomic setItem.
    const base = original === null ? '[]' : original;
    const closing = base.lastIndexOf(']');
    const additions = JSON.stringify(next.slice(existing.length)).slice(1, -1);
    const serialized = base.slice(0, closing) + (existing.length ? ',' : '') + additions + base.slice(closing);
    const verified = JSON.parse(serialized);
    if (verified.length !== next.length || JSON.stringify(verified.slice(0, existing.length)) !== JSON.stringify(existing)) {
      throw new Error('기존 기록 보존 검증에 실패했습니다.');
    }
    if (localStorage.getItem(CALENDAR_BACKUP_KEY) === null) {
      const backup = JSON.stringify({ original, backedUpAt: new Date().toISOString() });
      localStorage.setItem(CALENDAR_BACKUP_KEY, backup);
      if (localStorage.getItem(CALENDAR_BACKUP_KEY) !== backup) throw new Error('로컬 백업 검증에 실패했습니다.');
    }
    if (localStorage.getItem(STORAGE_KEY) !== original) throw new Error('기록이 변경되어 동기화를 중단했습니다. 다시 시도해 주세요.');
    localStorage.setItem(STORAGE_KEY, serialized);
  }
  return { lectures: next, addedCount, duplicateCount };
}

export function saveLectures(lectures: Lecture[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
}

export function saveLecture(
  lectureData: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Lecture {
  const existing = getLectures();
  const now = new Date().toISOString();

  if (lectureData.id) {
    const index = existing.findIndex((l) => l.id === lectureData.id);
    if (index >= 0) {
      const updated: Lecture = {
        ...existing[index],
        ...lectureData,
        id: lectureData.id,
        updatedAt: now,
      };
      existing[index] = updated;
      saveLectures(existing);
      return updated;
    }
  }

  const newLecture: Lecture = {
    ...lectureData,
    id: 'lec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: now,
    updatedAt: now,
  };
  existing.unshift(newLecture);
  saveLectures(existing);
  return newLecture;
}

export function deleteLecture(id: string): void {
  const existing = getLectures();
  saveLectures(existing.filter((l) => l.id !== id));
}

export function togglePaymentStatus(id: string): Lecture | null {
  const existing = getLectures();
  const index = existing.findIndex((l) => l.id === id);
  if (index >= 0) {
    const isNowPaid = !existing[index].isPaid;
    existing[index] = {
      ...existing[index],
      isPaid: isNowPaid,
      paidDate: isNowPaid ? new Date().toISOString().split('T')[0] : undefined,
      updatedAt: new Date().toISOString(),
    };
    saveLectures(existing);
    return existing[index];
  }
  return null;
}

export function resetToSampleData(): Lecture[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
}

export function clearAllLectures(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

// ─── Google Config ────────────────────────────────────

export function getGoogleConfig(): GoogleCalendarConfig {
  const defaultConfig: GoogleCalendarConfig = {
    calendarId: 'primary',
    isConnected: false,
    autoSync: true,
  };

  try {
    const raw = localStorage.getItem(GOOGLE_CONFIG_KEY);
    if (!raw) return defaultConfig;

    const parsed = JSON.parse(raw) as Partial<GoogleCalendarConfig>;
    return {
      ...defaultConfig,
      ...parsed,
      calendarId: typeof parsed.calendarId === 'string' && parsed.calendarId ? parsed.calendarId : 'primary',
      // OAuth access tokens are short-lived and must never be restored as a session.
      accessToken: undefined,
    };
  } catch (err) {
    console.error('Failed to parse Google config from localStorage:', err);
    localStorage.removeItem(GOOGLE_CONFIG_KEY);
    return defaultConfig;
  }
}

export function saveGoogleConfig(config: GoogleCalendarConfig): void {
  const { accessToken: _accessToken, ...safeConfig } = config;
  localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(safeConfig));
}
