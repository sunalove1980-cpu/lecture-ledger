# Lecture Ledger

강의 일정과 강의료 정산을 관리하고 Google Calendar의 `[G]` 일정을 가져오는 React/Vite 앱입니다.

## 로컬 실행

```bash
npm ci
copy .env.example .env.local
npm run dev
```

`.env.local`의 `VITE_GOOGLE_CLIENT_ID`에는 Google Cloud에서 만든 웹 애플리케이션 OAuth Client ID를 설정합니다.

## Google 로그인 설정

1. Google Cloud 프로젝트에서 Google Calendar API를 활성화합니다.
2. OAuth 동의 화면을 구성하고 `calendar.readonly` 범위를 사용합니다.
3. 웹 애플리케이션 OAuth Client ID를 만듭니다.
4. 승인된 JavaScript 원본에 로컬 주소와 실제 배포 주소를 등록합니다.
5. Vercel 환경변수 `VITE_GOOGLE_CLIENT_ID`에 Client ID를 저장한 뒤 다시 배포합니다.

사용자는 앱 화면에서 별도의 Client ID를 입력하지 않고 **Google로 로그인** 버튼만 누르면 됩니다.

## 확인

```bash
npm run lint
npm run build
```
