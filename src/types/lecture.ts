export type LocationType = 'online' | 'offline';

export interface Lecture {
  id: string;
  title: string;          // 강의명 / 주제
  agency: string;         // 위탁/중개 업체명 (예: 패스트캠퍼스, 러닝스푼즈, 기업 직출강 등)
  date: string;           // 강의 날짜 (YYYY-MM-DD)
  startTime: string;      // 시작 시간 (HH:mm)
  endTime: string;        // 종료 시간 (HH:mm)
  durationHours: number;  // 총 강의 시간 (시간 단위)
  totalFee: number;       // 강의료 (원화)
  isPaid: boolean;        // 입금 완료 여부
  paidDate?: string;      // 입금 확인 일자 (YYYY-MM-DD)
  locationType: LocationType; // 온라인 / 오프라인
  locationDetail?: string;// 장소 상세 (줌 링크 or 교육장 위치)
  notes?: string;         // 메모 (담당자, 준비물, 특이사항)
  emotion?: string;       // 강의 후 느낀 감정
  memorableMoment?: string; // 꼭 기억하고 싶은 장면이나 순간
  selfSatisfactionScore?: number; // 강사 스스로 느낀 만족감 (1~5)
  audienceResponseScore?: number; // 현장 참여자 반응 (1~5)
  coordinatorResponseScore?: number; // 담당자 반응 (1~5)
  reflectionReason?: string; // 회고 점수의 근거
  googleCalendarEventId?: string; // 구글 캘린더 이벤트 ID
  createdAt: string;
  updatedAt: string;
}

export interface AgencyStat {
  agency: string;
  totalFee: number;
  totalHours: number;
  lectureCount: number;
  percentage: number;
  color: string;
}

export interface MonthlySummary {
  yearMonth: string; // YYYY-MM
  monthName: string; // X월
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  totalHours: number;
  lectureCount: number;
}

export interface GoogleCalendarConfig {
  calendarId: string;
  isConnected: boolean;
  autoSync: boolean;
  lastSyncedAt?: string;
  userEmail?: string;
  accessToken?: string;
}
