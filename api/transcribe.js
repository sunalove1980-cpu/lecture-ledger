import { GoogleGenAI } from '@google/genai';

const VOCABULARY = [
  '수토피아', '지역자활센터', '퍼실리테이션', '교류분석', '생성형 AI',
  '평생학습관', '사회복지관', '취업역량', '강사역량', '아이스브레이킹',
];

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const allowedEmail = process.env.TRANSCRIPTION_ALLOWED_EMAIL;
  if (!apiKey || !allowedEmail) {
    return response.status(503).json({ error: '음성 전사 설정이 아직 완료되지 않았습니다.' });
  }

  const authorization = request.headers.authorization || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!accessToken) {
    return response.status(401).json({ error: '먼저 Google 계정을 연결해 주세요.' });
  }

  try {
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoResponse.ok) return response.status(401).json({ error: 'Google 로그인이 만료되었습니다. 다시 동기화해 주세요.' });

    const userInfo = await userInfoResponse.json();
    if (userInfo.email?.toLowerCase() !== allowedEmail.toLowerCase()) {
      return response.status(403).json({ error: '이 계정에는 음성 전사 권한이 없습니다.' });
    }

    const { audioBase64, mimeType } = request.body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return response.status(400).json({ error: '녹음 파일이 없습니다.' });
    }
    if (audioBase64.length > 6_000_000) {
      return response.status(413).json({ error: '녹음이 너무 깁니다. 3분 이내로 나눠서 녹음해 주세요.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: 'gemini-3.5-transcribe',
      input: [{
        type: 'audio',
        data: audioBase64,
        mime_type: mimeType || 'audio/webm',
      }],
      generation_config: {
        transcription_config: {
          language_codes: ['ko-KR'],
          custom_vocabulary: VOCABULARY,
          mode: 'smart',
        },
      },
      store: false,
    });

    const transcript = interaction.output_text?.trim();
    if (!transcript) return response.status(502).json({ error: '음성을 글로 변환하지 못했습니다. 다시 녹음해 주세요.' });
    return response.status(200).json({ transcript });
  } catch (error) {
    console.error('Gemini transcription failed:', error);
    return response.status(500).json({ error: '음성 전사 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}
