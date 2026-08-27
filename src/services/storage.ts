import type { Lecture, GoogleCalendarConfig } from '../types/lecture';

const STORAGE_KEY = 'lecture_fee_manager_lectures_v1';
const GOOGLE_CONFIG_KEY = 'lecture_fee_manager_google_config_v1';

export const POPULAR_AGENCIES = [
  '패스트캠퍼스',
  '러닝스푼즈',
  '멀티캠퍼스',
  '원티드 프리온보딩',
  '멋쟁이사자처럼',
  '인프런',
  '삼성 청년 SW 아카데미(SSAFY)',
  '기업 직접 출강',
  '대학교/공공기관'
];

// Soft, modern pastel color palette
export const AGENCY_COLORS: Record<string, string> = {
  '패스트캠퍼스': '#f43f5e',     // Pastel Coral Red
  '러닝스푼즈': '#0284c7',       // Pastel Sky Ocean
  '멀티캠퍼스': '#059669',       // Pastel Sage Mint
  '원티드 프리온보딩': '#6366f1', // Soft Periwinkle
  '멋쟁이사자처럼': '#d97706',   // Warm Honey Amber
  '인프런': '#0891b2',           // Soft Cyan Teal
  '삼성 청년 SW 아카데미(SSAFY)': '#db2777', // Soft Pink
  '기업 직접 출강': '#475569',   // Slate Blue
  '대학교/공공기관': '#0d9488',   // Pastel Teal
};

export const DEFAULT_COLOR = '#64748b'; // Slate

export function getAgencyColor(agencyName: string): string {
  if (AGENCY_COLORS[agencyName]) {
    return AGENCY_COLORS[agencyName];
  }
  const pastelColors = ['#0284c7', '#059669', '#d97706', '#6366f1', '#f43f5e', '#0891b2', '#0d9488', '#db2777'];
  let hash = 0;
  for (let i = 0; i < agencyName.length; i++) {
    hash = agencyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return pastelColors[Math.abs(hash) % pastelColors.length];
}


// Initial realistic sample data
const SAMPLE_LECTURES: Lecture[] = [
  {
    id: 'sample-1',
    title: '실무 생성형 AI 비즈니스 프롬프트 엔지니어링',
    agency: '패스트캠퍼스',
    date: '2026-08-05',
    startTime: '10:00',
    endTime: '17:00',
    durationHours: 6,
    totalFee: 1200000,
    isPaid: true,
    paidDate: '2026-08-10',
    locationType: 'online',
    locationDetail: 'Zoom 온라인 강의실',
    notes: '실무 프롬프트 템플릿 실습 및 질의응답',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'sample-2',
    title: 'LLM & RAG 기반 AI 에이전트 구축 실무 워크숍',
    agency: '러닝스푼즈',
    date: '2026-08-12',
    startTime: '13:00',
    endTime: '18:00',
    durationHours: 5,
    totalFee: 1500000,
    isPaid: true,
    paidDate: '2026-08-20',
    locationType: 'offline',
    locationDetail: '러닝스푼즈 강남캠퍼스 301호',
    notes: '파이썬 기반 실습, 준비물: 개인 노트북',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
  },
  {
    id: 'sample-3',
    title: '신입 개발자를 위한 최신 웹 개발 트렌드 특강',
    agency: '멀티캠퍼스',
    date: '2026-08-19',
    startTime: '14:00',
    endTime: '18:00',
    durationHours: 4,
    totalFee: 800000,
    isPaid: false,
    locationType: 'offline',
    locationDetail: '멀티캠퍼스 역삼 교육센터',
    notes: '익월 10일 정산 예정',
    createdAt: '2026-08-03T11:00:00.000Z',
    updatedAt: '2026-08-03T11:00:00.000Z',
  },
  {
    id: 'sample-4',
    title: '사내 업무 자동화 및 AI 툴 활용 특강',
    agency: '기업 직접 출강',
    date: '2026-08-26',
    startTime: '09:30',
    endTime: '16:30',
    durationHours: 6,
    totalFee: 2000000,
    isPaid: false,
    locationType: 'offline',
    locationDetail: '판교 테크노밸리 사옥 본사 대강당',
    notes: '임직원 100명 대상 특강',
    createdAt: '2026-08-04T12:00:00.000Z',
    updatedAt: '2026-08-04T12:00:00.000Z',
  },
  {
    id: 'sample-5',
    title: 'React & Next.js 인터랙티브 웹 UI 심화',
    agency: '원티드 프리온보딩',
    date: '2026-07-08',
    startTime: '19:00',
    endTime: '22:00',
    durationHours: 3,
    totalFee: 600000,
    isPaid: true,
    paidDate: '2026-07-25',
    locationType: 'online',
    locationDetail: '유튜브 라이브 및 구글 밋',
    notes: '수강생 Q&A 세션 진행',
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'sample-6',
    title: '비전공자를 위한 AI 코딩 입문 특강',
    agency: '패스트캠퍼스',
    date: '2026-07-15',
    startTime: '10:00',
    endTime: '16:00',
    durationHours: 5,
    totalFee: 1000000,
    isPaid: true,
    paidDate: '2026-07-20',
    locationType: 'online',
    locationDetail: '온라인 웨비나',
    createdAt: '2026-07-02T10:00:00.000Z',
    updatedAt: '2026-07-02T10:00:00.000Z',
  },
  {
    id: 'sample-7',
    title: '스타트업 개발 리더십 및 협업 세미나',
    agency: '멋쟁이사자처럼',
    date: '2026-07-22',
    startTime: '14:00',
    endTime: '18:00',
    durationHours: 4,
    totalFee: 900000,
    isPaid: true,
    paidDate: '2026-07-31',
    locationType: 'offline',
    locationDetail: '성수 헤이그라운드 이벤트홀',
    createdAt: '2026-07-03T11:00:00.000Z',
    updatedAt: '2026-07-03T11:00:00.000Z',
  },
  {
    id: 'sample-8',
    title: '공공 데이터 기반 AI 서비스 기획 워크숍',
    agency: '대학교/공공기관',
    date: '2026-06-18',
    startTime: '10:00',
    endTime: '17:00',
    durationHours: 6,
    totalFee: 1200000,
    isPaid: true,
    paidDate: '2026-06-30',
    locationType: 'offline',
    locationDetail: '서울대학교 소프트웨어 연구동',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'sample-9',
    title: '대기업 부서장 대상 AI 리터러시 특강',
    agency: '기업 직접 출강',
    date: '2026-06-25',
    startTime: '13:30',
    endTime: '16:30',
    durationHours: 3,
    totalFee: 1500000,
    isPaid: true,
    paidDate: '2026-06-30',
    locationType: 'offline',
    locationDetail: '본사 연수원 4층',
    createdAt: '2026-06-02T10:00:00.000Z',
    updatedAt: '2026-06-02T10:00:00.000Z',
  }
];

export function getLectures(): Lecture[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time loading - initialize with sample data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_LECTURES));
      return SAMPLE_LECTURES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse lectures from localStorage:', err);
    return SAMPLE_LECTURES;
  }
}

export function saveLectures(lectures: Lecture[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
}

export function saveLecture(lectureData: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Lecture {
  const existing = getLectures();
  const now = new Date().toISOString();
  
  if (lectureData.id) {
    // Update
    const index = existing.findIndex(l => l.id === lectureData.id);
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

  // Create new
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
  const filtered = existing.filter(l => l.id !== id);
  saveLectures(filtered);
}

export function togglePaymentStatus(id: string): Lecture | null {
  const existing = getLectures();
  const index = existing.findIndex(l => l.id === id);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_LECTURES));
  return SAMPLE_LECTURES;
}

export function clearAllLectures(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

export function getGoogleConfig(): GoogleCalendarConfig {
  const raw = localStorage.getItem(GOOGLE_CONFIG_KEY);
  if (!raw) {
    return {
      userEmail: 'sunalove1980@gmail.com',
      clientId: '',
      apiKey: '',
      calendarId: 'primary',
      isConnected: true,
      autoSync: true,
    };
  }
  return JSON.parse(raw);
}


export function saveGoogleConfig(config: GoogleCalendarConfig): void {
  localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(config));
}
