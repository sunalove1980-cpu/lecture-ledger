/**
 * Google Calendar 실제 연동 서비스
 *
 * - Google Identity Services (GIS)를 사용한 OAuth2 access token 획득
 * - Calendar API v3 REST endpoints를 fetch로 직접 호출
 * - [G] prefix 이벤트 필터링 및 Lecture 데이터 변환
 *
 * [G] 이벤트 형식 예시:
 *   [G] 15시~17시, CS, 여성회관, 23만원
 *   → 시간, 강의명, 장소, 강의료
 */

const CALENDAR_SCOPES = 'openid email https://www.googleapis.com/auth/calendar.readonly';
const VOICE_SCOPES = 'openid email';
export const GOOGLE_SYNC_START_DATE = '2026-10-07';
export const GOOGLE_SYNC_CREATED_MIN = '2026-10-07T00:00:00+09:00';
export const GOOGLE_SYNC_SOURCE_MARKER = '등록: 루미';
const GOOGLE_SYNC_TIME_MIN = `${GOOGLE_SYNC_START_DATE}T00:00:00+09:00`;

declare global {
  interface Window {
    google: any;
  }
}

let tokenClient: any = null;
let voiceTokenClient: any = null;
let currentAccessToken: string | null = null;

function waitForGoogleIdentityServices(timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error('Google 로그인 서비스를 불러오지 못했습니다. 네트워크 연결이나 광고 차단 설정을 확인해 주세요.'));
        return;
      }
      window.setTimeout(check, 100);
    };
    check();
  });
}

// ─── GIS 스크립트 로드 ───────────────────────────────

export function loadGoogleIdentityServices(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      waitForGoogleIdentityServices().then(resolve, reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => waitForGoogleIdentityServices().then(resolve, reject);
    script.onerror = () => reject(new Error('Google Identity Services 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

// ─── Token Client 초기화 ──────────────────────────────

export async function initTokenClient(clientId: string): Promise<void> {
  await loadGoogleIdentityServices();
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google 로그인 서비스를 초기화할 수 없습니다.');
  }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: CALENDAR_SCOPES,
    callback: () => {}, // requestAccessToken에서 실제 콜백으로 교체
  });
}

// ─── 음성 전사용 Google 로그인 ───────────────────────

export async function initVoiceTokenClient(clientId: string): Promise<void> {
  await loadGoogleIdentityServices();
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google 로그인 서비스를 초기화할 수 없습니다.');
  }
  voiceTokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: VOICE_SCOPES,
    include_granted_scopes: false,
    callback: () => {},
  });
}

export function requestVoiceAccessToken(prompt: '' | 'consent' = ''): Promise<{ accessToken: string; email: string }> {
  return new Promise((resolve, reject) => {
    if (!voiceTokenClient) {
      reject(new Error('음성 전사용 Google 로그인을 먼저 준비해 주세요.'));
      return;
    }

    voiceTokenClient.callback = async (response: any) => {
      if (response.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }

      currentAccessToken = response.access_token;
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${currentAccessToken}` },
        });
        const info = await userInfo.json();
        resolve({ accessToken: response.access_token, email: info.email || '' });
      } catch {
        resolve({ accessToken: response.access_token, email: '' });
      }
    };

    voiceTokenClient.requestAccessToken({ prompt });
  });
}

// ─── Access Token 요청 (구글 로그인 팝업) ──────────────

export function requestAccessToken(prompt: '' | 'consent' = 'consent'): Promise<{ accessToken: string; email: string }> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('initTokenClient를 먼저 호출하세요.'));
      return;
    }

    tokenClient.callback = async (response: any) => {
      if (response.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }

      currentAccessToken = response.access_token;

      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${currentAccessToken}` },
        });
        const info = await userInfo.json();
        resolve({ accessToken: response.access_token, email: info.email || '' });
      } catch {
        resolve({ accessToken: response.access_token, email: '' });
      }
    };

    tokenClient.requestAccessToken({ prompt });
  });
}

// ─── Calendar API: 이벤트 목록 조회 ───────────────────

export async function fetchCalendarEvents(
  token: string,
  calendarId = 'primary',
  timeMin?: string,
  timeMax?: string,
): Promise<any[]> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    // 조회 범위와 별도로 변환 시 출처 및 실제 생성 시각을 검사합니다.
    timeMin: timeMin || GOOGLE_SYNC_TIME_MIN,
    maxResults: '2500',
  });

  if (timeMax) params.set('timeMax', timeMax);

  const events: any[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) params.set('pageToken', pageToken);

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Calendar API 오류 (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    if (!data || (data.items !== undefined && !Array.isArray(data.items))
      || (data.nextPageToken !== undefined && typeof data.nextPageToken !== 'string')) {
      throw new Error('캘린더 응답 형식이 올바르지 않습니다. 기존 기록은 변경하지 않았습니다.');
    }
    events.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}

// ─── [G] 이벤트 파싱 유틸리티 ─────────────────────────

/**
 * 강의료 파싱: "23만원" → 230000, "120만원" → 1200000, "50만" → 500000
 */
function parseFee(text: string): number {
  const trimmed = text.trim().replace(/,/g, '');

  // "23만원", "23만", "1.5만원"
  const manMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*만\s*원?$/);
  if (manMatch) {
    return Math.round(parseFloat(manMatch[1]) * 10000);
  }

  // "230000원", "230000"
  const wonMatch = trimmed.match(/^(\d+)\s*원?$/);
  if (wonMatch) {
    return parseInt(wonMatch[1], 10);
  }

  throw new Error(`강의료 형식 오류: ${text}`);
}

/**
 * 시간 파싱: "9~11시", "1시 30분~5시 30분", "09:30~11:30", "오후 1~3시"
 */
function parseTimeRange(text: string): { startTime: string; endTime: string } | null {
  const points = text.trim().split(/\s*[~～\-–]\s*/);
  if (points.length !== 2) return null;

  const parseTimePoint = (point: string) => {
    const match = point.trim().match(
      /^(?:(오전|오후)\s*)?(\d{1,2})(?:(?:\s*시)?\s*(\d{1,2})\s*분|:(\d{1,2})|\s*시)?$/,
    );
    if (!match) return null;

    const minute = parseInt(match[3] || match[4] || '0', 10);
    if (minute > 59) return null;

    return {
      period: match[1] || undefined,
      hourText: match[2],
      minute,
    };
  };

  const start = parseTimePoint(points[0]);
  const end = parseTimePoint(points[1]);
  if (!start || !end) return null;

  const to24Hour = (hourText: string, period?: string) => {
    let hour = parseInt(hourText, 10);
    if (period === '오전' && hour === 12) hour = 0;
    if (period === '오후' && hour < 12) hour += 12;
    return hour;
  };

  const startHour = to24Hour(start.hourText, start.period);
  const endHour = to24Hour(end.hourText, end.period || start.period);

  if (startHour > 23 || endHour > 23) return null;

  return {
    startTime: `${String(startHour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}`,
    endTime: `${String(endHour).padStart(2, '0')}:${String(end.minute).padStart(2, '0')}`,
  };
}

// ─── [G] 이벤트 → 강의 데이터 변환 ───────────────────

export interface CalendarLecture {
  googleCalendarEventId: string;
  title: string;
  agency: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalFee: number;
  locationDetail?: string;
  notes?: string;
}

/**
 * [G] 이벤트를 강의 데이터로 변환합니다.
 *
 * 지원하는 형식:
 *   [G] 9~11시, CS 강의, 패스트캠퍼스, 23만원
 *   [G] AI 특강, 온라인, 23만원
 *
 * 설명의 독립된 줄에 등록: 루미 표시와 생성 시각 기준이 필요합니다.
 * 금액 누락/오류는 전체 가져오기를 중단하여 저장된 기록을 보존합니다.
 *
 * 쉼표로 구분된 필드:
 *   1번째: 시간 (15시~17시) — 없으면 캘린더 이벤트 시간 사용
 *   2번째: 강의명/주제
 *   3번째: 강의 업체
 *   4번째: 강의료 (23만원)
 */
export function parseGEventsToLectures(events: any[]): CalendarLecture[] {
  return events
    .filter((event) => {
      if (!event || typeof event !== 'object') throw new Error('잘못된 캘린더 일정입니다.');
      const summary = typeof event.summary === 'string' ? event.summary : '';
      const created = typeof event.created === 'string' ? Date.parse(event.created) : NaN;
      const startRaw = event.start?.dateTime || event.start?.date || '';
      return event.status !== 'cancelled'
        && summary.trimStart().startsWith('[G]')
        && typeof event.description === 'string'
        && event.description.split(/\r?\n/).some((line: string) => line.trim() === GOOGLE_SYNC_SOURCE_MARKER)
        && Number.isFinite(created) && created >= Date.parse(GOOGLE_SYNC_CREATED_MIN)
        && typeof startRaw === 'string' && startRaw.slice(0, 10) >= GOOGLE_SYNC_START_DATE;
    })
    .map((event) => {
      // [G] 접두사 제거
      const rawText = (event.summary || '').replace(/\[G\]\s*/g, '').trim();

      // 캘린더 이벤트 자체의 시간 정보 (fallback)
      const startRaw = event.start?.dateTime || event.start?.date;
      const endRaw = event.end?.dateTime || event.end?.date;
      if (typeof event.id !== 'string' || !event.id || !event.start?.dateTime || !event.end?.dateTime) {
        throw new Error('루미 일정의 ID 또는 시작·종료 시각이 없습니다.');
      }
      const startDate = new Date(startRaw);
      const endDate = new Date(endRaw);

      // 브라우저의 시간대와 무관하게 한국 현지 날짜와 시간을 사용합니다.
      if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) {
        throw new Error('루미 일정의 날짜·시간이 올바르지 않습니다.');
      }
      const localParts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(date).map(({ type, value }) => [type, value]));
      const start = localParts(startDate);
      const end = localParts(endDate);
      const eventDate = `${start.year}-${start.month}-${start.day}`;
      let eventStartTime = `${start.hour}:${start.minute}`;
      let eventEndTime = `${end.hour}:${end.minute}`;

      // 쉼표로 분리
      const parts = rawText.split(',').map((p: string) => p.trim());
      if (parts.length > 4) throw new Error('강의 제목 형식을 확인해 주세요. 금액은 23만원처럼 입력해 주세요.');

      let title = rawText;
      let agency = '';
      const locationDetail: string | undefined = event.location || undefined;
      let totalFee = NaN;

      if (parts.length >= 4) {
        // [G] 9~11시, CS 강의, 패스트캠퍼스, 23만원
        const timeInfo = parseTimeRange(parts[0]);
        if (timeInfo) {
          eventStartTime = timeInfo.startTime;
          eventEndTime = timeInfo.endTime;
        }
        title = parts[1];
        agency = parts[2];
        totalFee = parseFee(parts[3]);
      } else if (parts.length === 3) {
        // [G] 9~11시, CS 강의, 패스트캠퍼스  OR  [G] CS 강의, 패스트캠퍼스, 23만원
        const timeInfo = parseTimeRange(parts[0]);
        if (timeInfo) {
          eventStartTime = timeInfo.startTime;
          eventEndTime = timeInfo.endTime;
          title = parts[1];
          agency = parts[2];
        } else {
          title = parts[0];
          agency = parts[1];
          totalFee = parseFee(parts[2]);
        }
      } else if (parts.length === 2) {
        // [G] 9~11시, CS 강의  OR  [G] CS 강의, 패스트캠퍼스
        const timeInfo = parseTimeRange(parts[0]);
        if (timeInfo) {
          eventStartTime = timeInfo.startTime;
          eventEndTime = timeInfo.endTime;
          title = parts[1];
        } else {
          title = parts[0];
          agency = parts[1];
        }
      }
      // parts.length === 1: title = rawText (이미 설정됨)

      if (!title || !Number.isSafeInteger(totalFee) || totalFee < 0) {
        throw new Error('루미 일정의 강의명 또는 강의료를 확인해 주세요. 기존 기록은 변경하지 않았습니다.');
      }

      // 시간 차이 계산
      const [startH, startM] = eventStartTime.split(':').map(Number);
      const [endH, endM] = eventEndTime.split(':').map(Number);
      const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (durationMinutes <= 0) throw new Error('강의 시작·종료 시간을 확인해 주세요.');
      const durationHours = durationMinutes / 60;

      return {
        googleCalendarEventId: event.id,
        title: title || '(제목 없음)',
        agency,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        durationHours,
        totalFee,
        locationDetail,
        notes: event.description || undefined,
      };
    });
}

// ─── 유틸리티 ─────────────────────────────────────────

export function setAccessToken(token: string): void {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function revokeToken(): void {
  if (currentAccessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(currentAccessToken, () => {
      console.log('Token revoked');
    });
  }
  currentAccessToken = null;
  tokenClient = null;
  voiceTokenClient = null;
}
