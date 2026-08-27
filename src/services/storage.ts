import type { Lecture, GoogleCalendarConfig } from '../types/lecture';

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
  const raw = localStorage.getItem(GOOGLE_CONFIG_KEY);
  if (!raw) {
    return {
      clientId: '',
      calendarId: 'primary',
      isConnected: false,
      autoSync: true,
    };
  }
  return JSON.parse(raw);
}

export function saveGoogleConfig(config: GoogleCalendarConfig): void {
  localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(config));
}
