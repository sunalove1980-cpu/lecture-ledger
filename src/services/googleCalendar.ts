import type { Lecture, GoogleCalendarConfig } from '../types/lecture';

// Google API discovery doc & scope
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any = null;
let gapiInited = false;


export async function initGoogleClient(
  config: GoogleCalendarConfig,
  onSuccess: () => void,
  onError: (err: any) => void
): Promise<void> {
  if (!config.clientId || !config.apiKey) {
    onError(new Error('Google Client ID와 API Key가 필요합니다.'));
    return;
  }

  try {
    if (!window.gapi) {
      await loadScript('https://apis.google.com/js/api.js');
    }
    if (!window.google?.accounts) {
      await loadScript('https://accounts.google.com/gsi/client');
    }

    await new Promise<void>((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: config.apiKey,
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: SCOPES,
      callback: '',
    });

    onSuccess();

  } catch (err) {
    console.error('Google Client Init Error:', err);
    onError(err);
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
}

export async function requestGoogleAuth(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Client가 초기화되지 않았습니다.'));
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }
      resolve(true);
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

export async function createGoogleCalendarEvent(lecture: Lecture, calendarId = 'primary'): Promise<string | null> {
  if (!gapiInited || !window.gapi?.client?.calendar) {
    console.warn('Google Calendar API not ready.');
    return null;
  }

  const startDateTime = `${lecture.date}T${lecture.startTime}:00`;
  const endDateTime = `${lecture.date}T${lecture.endTime}:00`;

  const agencyPrefix = lecture.agency ? `[${lecture.agency}] ` : '';
  const event = {
    summary: `[강의] ${agencyPrefix}${lecture.title}`,
    description: `[강의 상세 정보]
- 위탁/중개업체: ${lecture.agency || '미지정'}
- 강의료: ${lecture.totalFee.toLocaleString('ko-KR')}원 (${lecture.isPaid ? '입금 완료' : '미입금'})
- 진행 형태: ${lecture.locationType === 'online' ? '온라인' : '오프라인'}
- 장소/링크: ${lecture.locationDetail || '미정'}
- 메모: ${lecture.notes || '-'}
(강의료 정산 매니저 앱에서 동기화됨)`,
    location: lecture.locationDetail || '',
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  try {
    const response = await window.gapi.client.calendar.events.insert({
      calendarId,
      resource: event,
    });
    return response.result.id || null;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

export async function fetchGoogleCalendarEvents(calendarId = 'primary', timeMin?: string, timeMax?: string): Promise<any[]> {
  if (!gapiInited || !window.gapi?.client?.calendar) {
    throw new Error('Google Calendar API가 연동되지 않았습니다.');
  }

  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId,
      timeMin: timeMin || new Date(new Date().getFullYear(), 0, 1).toISOString(),
      timeMax: timeMax || new Date(new Date().getFullYear() + 1, 0, 1).toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.result.items || [];
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

export function simulateGoogleCalendarSync(currentLectures: Lecture[]): { newLectures: Lecture[]; syncedCount: number } {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const dateStr = nextWeek.toISOString().split('T')[0];

  const simulatedLecture: Lecture = {
    id: 'gcal_sim_' + Date.now(),
    title: '구글 캘린더 연동 AI 특강 세미나',
    agency: '패스트캠퍼스',
    date: dateStr,
    startTime: '14:00',
    endTime: '17:00',
    durationHours: 3,
    totalFee: 900000,
    isPaid: false,
    locationType: 'online',
    locationDetail: 'Google Meet 화상회의',
    notes: '구글 캘린더 연동을 통해 자동 동기화된 강의 일정입니다.',
    googleCalendarEventId: 'simulated_event_gcal_123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    newLectures: [simulatedLecture, ...currentLectures],
    syncedCount: 1,
  };
}