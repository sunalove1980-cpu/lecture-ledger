import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Mic, Square } from 'lucide-react';
import { getAccessToken } from '../services/googleCalendar';

interface VoiceTranscriberProps { onTranscript: (text: string) => void; }
type RecorderState = 'idle' | 'recording' | 'transcribing';

export const VoiceTranscriber: React.FC<VoiceTranscriberProps> = ({ onTranscript }) => {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const formatElapsed = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('녹음 파일을 읽지 못했습니다.'));
    reader.readAsDataURL(blob);
  });

  const transcribe = async (blob: Blob) => {
    setState('transcribing');
    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error('먼저 상단 SYNC 버튼으로 Google 계정을 연결해 주세요.');
      const audioBase64 = await blobToBase64(blob);
      const result = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ audioBase64, mimeType: blob.type || 'audio/webm' }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || '음성 전사에 실패했습니다.');
      onTranscript(data.transcript);
      setError('');
    } catch (transcriptionError) {
      setError(transcriptionError instanceof Error ? transcriptionError.message : '음성 전사에 실패했습니다.');
    } finally {
      setState('idle');
      setElapsed(0);
    }
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      chunksRef.current = [];
      const preferredType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (blob.size) void transcribe(blob);
      };
      recorder.start(500);
      setState('recording');
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed(current => {
          if (current >= 179) recorderRef.current?.stop();
          return current + 1;
        });
      }, 1000);
    } catch {
      setError('마이크 권한을 허용해야 음성으로 기록할 수 있어요.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  return <div className="mt-2">
    {state === 'recording' ? (
      <button type="button" onClick={stopRecording} className="flex w-full items-center justify-center gap-2 border border-[#9b513e] bg-[#f4ddd6] px-3 py-2.5 text-xs font-black text-[#813f30]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#9b513e]" /><Square className="h-3.5 w-3.5 fill-current" /> 녹음 종료 · {formatElapsed(elapsed)}</button>
    ) : state === 'transcribing' ? (
      <div className="flex items-center justify-center gap-2 border border-[#c8c3b7] bg-[#e8e3d8] px-3 py-2.5 text-xs font-bold text-[#66675f]"><LoaderCircle className="h-4 w-4 animate-spin" /> Gemini가 음성을 정리하고 있어요…</div>
    ) : (
      <button type="button" onClick={startRecording} className="flex w-full items-center justify-center gap-2 border border-[#69735f] px-3 py-2.5 text-xs font-black text-[#596250] transition hover:bg-[#e5e8df]"><Mic className="h-4 w-4" /> 음성으로 기억할 장면 기록</button>
    )}
    <p className="mt-1.5 text-[9px] leading-4 text-[#89877e]">최대 3분 · 녹음 종료 시 음성이 Google Gemini로 전송되어 글로 변환됩니다.</p>
    {error && <p className="mt-1.5 text-[10px] font-semibold text-[#9b513e]">{error}</p>}
  </div>;
};
