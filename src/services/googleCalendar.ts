import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { CommuteTime } from '../types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
];

export interface CalendarEventInput {
  dateKey: string;
  commute?: CommuteTime;
}

export interface GoogleAuthSession {
  accessToken: string;
  email: string;
}

function toRFC3339(dateKey: string, time: string): { start: string; end: string } {
  const [h, m] = time.split(':').map(Number);
  const startHour = String(h).padStart(2, '0');
  const startMin = String(m).padStart(2, '0');
  const endH = Math.min(h + 1, 23);
  const endMin = h + 1 > 23 ? m : m;
  return {
    start: `${dateKey}T${startHour}:${startMin}:00`,
    end: `${dateKey}T${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`,
  };
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Google 계정 정보를 가져오지 못했습니다.');
  }
  const data = (await res.json()) as { email?: string };
  return data.email ?? '';
}

/** 기기에 로그인된 Google 계정 중 하나를 선택해 인증합니다. */
export async function authenticateGoogle(): Promise<GoogleAuthSession | null> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Google Client ID가 설정되지 않았습니다. .env 파일에 EXPO_PUBLIC_GOOGLE_CLIENT_ID를 추가해주세요.'
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'googlecalenderapp' });

  const authRequest = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Token,
    usePKCE: false,
    extraParams: {
      prompt: 'select_account',
    },
  });

  const result = await authRequest.promptAsync(discovery);

  if (result.type === 'success' && result.params.access_token) {
    const accessToken = result.params.access_token as string;
    const email = await fetchGoogleUserEmail(accessToken);
    return { accessToken, email };
  }
  return null;
}

/** 선택한 Google 계정의 기본(primary) 달력에 일정을 등록합니다. */
export async function createCalendarEvents(
  accessToken: string,
  events: CalendarEventInput[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const event of events) {
    const title = '출근';
    const description = '출퇴근 관리 앱에서 등록된 출근일';

    let body: Record<string, unknown>;

    if (event.commute?.clockIn && event.commute?.clockOut) {
      const start = `${event.dateKey}T${event.commute.clockIn}:00`;
      const end = `${event.dateKey}T${event.commute.clockOut}:00`;
      body = {
        summary: title,
        description,
        start: { dateTime: start, timeZone: 'Asia/Seoul' },
        end: { dateTime: end, timeZone: 'Asia/Seoul' },
      };
    } else if (event.commute?.clockIn) {
      const { start, end } = toRFC3339(event.dateKey, event.commute.clockIn);
      body = {
        summary: title,
        description,
        start: { dateTime: start, timeZone: 'Asia/Seoul' },
        end: { dateTime: end, timeZone: 'Asia/Seoul' },
      };
    } else {
      body = {
        summary: title,
        description,
        start: { date: event.dateKey },
        end: { date: event.dateKey },
      };
    }

    try {
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) success++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
}
