import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Coins, 
  Laptop, 
  Building2, 
  Check, 
  RefreshCw
} from 'lucide-react';
import type { Lecture, LocationType } from '../types/lecture';
import { POPULAR_AGENCIES } from '../services/storage';

interface LectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lecture: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, syncToGCal?: boolean) => void;
  initialLecture?: Lecture | null;
  defaultDate?: string;
  isGoogleConnected?: boolean;
}

export const LectureModal: React.FC<LectureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLecture,
  defaultDate,
  isGoogleConnected,
}) => {
  const [title, setTitle] = useState('');
  const [agency, setAgency] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('17:00');
  const [durationHours, setDurationHours] = useState<number>(6);
  const [totalFee, setTotalFee] = useState<number>(1000000);
  const [hourlyRate, setHourlyRate] = useState<number>(200000);
  const [feeMode, setFeeMode] = useState<'total' | 'hourly'>('total');
  const [isPaid, setIsPaid] = useState(false);
  const [locationType, setLocationType] = useState<LocationType>('online');
  const [locationDetail, setLocationDetail] = useState('');
  const [notes, setNotes] = useState('');
  const [syncToGCal, setSyncToGCal] = useState(false);

  const calculateDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) {
        return Math.round((diff / 60) * 10) / 10;
      }
      return 1;
    } catch {
      return 1;
    }
  };

  useEffect(() => {
    if (initialLecture) {
      setTitle(initialLecture.title || '');
      setAgency(initialLecture.agency || '');
      setDate(initialLecture.date || new Date().toISOString().split('T')[0]);
      setStartTime(initialLecture.startTime || '10:00');
      setEndTime(initialLecture.endTime || '17:00');
      setDurationHours(initialLecture.durationHours || 6);
      setTotalFee(initialLecture.totalFee || 0);
      setIsPaid(initialLecture.isPaid || false);
      setLocationType(initialLecture.locationType || 'online');
      setLocationDetail(initialLecture.locationDetail || '');
      setNotes(initialLecture.notes || '');
      setFeeMode('total');
    } else {
      const todayStr = defaultDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setAgency('');
      setDate(todayStr);
      setStartTime('10:00');
      setEndTime('17:00');
      setDurationHours(6);
      setTotalFee(1000000);
      setHourlyRate(200000);
      setIsPaid(false);
      setLocationType('online');
      setLocationDetail('Zoom 화상강의');
      setNotes('');
      setSyncToGCal(!!isGoogleConnected);
    }
  }, [initialLecture, defaultDate, isOpen, isGoogleConnected]);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const newDur = calculateDuration(newStart, endTime);
    setDurationHours(newDur);
    if (feeMode === 'hourly') {
      setTotalFee(Math.round(hourlyRate * newDur));
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    const newDur = calculateDuration(startTime, newEnd);
    setDurationHours(newDur);
    if (feeMode === 'hourly') {
      setTotalFee(Math.round(hourlyRate * newDur));
    }
  };

  const handleHourlyRateChange = (rate: number) => {
    setHourlyRate(rate);
    setTotalFee(Math.round(rate * durationHours));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('강의명을 입력해 주세요.');
      return;
    }
    if (!date) {
      alert('강의 날짜를 선택해 주세요.');
      return;
    }

    onSave(
      {
        id: initialLecture?.id,
        title: title.trim(),
        agency: agency.trim() || '기타 / 직접 출강',
        date,
        startTime,
        endTime,
        durationHours: Number(durationHours) || 1,
        totalFee: Number(totalFee) || 0,
        isPaid,
        locationType,
        locationDetail: locationDetail.trim(),
        notes: notes.trim(),
      },
      syncToGCal
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                {initialLecture ? '강의 일정 수정' : '새 강의 일정 등록'}
              </h3>
              <p className="text-[11px] text-slate-400">
                일정 및 강의료를 입력하세요 (저장 시 자동 계산 반영)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[82vh] overflow-y-auto">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              강의명 / 주제 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 실무 생성형 AI 비즈니스 프롬프트 엔지니어링"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
            />
          </div>

          {/* Agency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              위탁 / 중개 업체명 (기관)
            </label>
            <input
              type="text"
              placeholder="예: 패스트캠퍼스, 러닝스푼즈, 기업 직접 출강"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 mb-1.5"
            />
            {/* Chips */}
            <div className="flex flex-wrap gap-1">
              {POPULAR_AGENCIES.slice(0, 6).map((popAgency) => (
                <button
                  type="button"
                  key={popAgency}
                  onClick={() => setAgency(popAgency)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all ${
                    agency === popAgency
                      ? 'bg-sky-500 text-white border-sky-500 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {popAgency}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                강의 날짜 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                시작 시간
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                종료 시간
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Fee Section */}
          <div className="p-3.5 bg-sky-50/60 rounded-2xl border border-sky-100/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-sky-600" />
                강의 시간 및 강의료
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-sky-100 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setFeeMode('total')}
                  className={`px-2 py-0.5 rounded ${feeMode === 'total' ? 'bg-sky-500 text-white' : 'text-slate-600'}`}
                >
                  총액 직접입력
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFeeMode('hourly');
                    setTotalFee(Math.round(hourlyRate * durationHours));
                  }}
                  className={`px-2 py-0.5 rounded ${feeMode === 'hourly' ? 'bg-sky-500 text-white' : 'text-slate-600'}`}
                >
                  시급 계산
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  총 강의 시간 (시간)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={durationHours}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setDurationHours(d);
                    if (feeMode === 'hourly') setTotalFee(Math.round(hourlyRate * d));
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              {feeMode === 'hourly' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    시간당 단가 (원)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={hourlyRate}
                    onChange={(e) => handleHourlyRateChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    총 강의료 (원)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={totalFee}
                    onChange={(e) => setTotalFee(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-sky-700"
                  />
                </div>
              )}
            </div>

            <div className="text-right text-xs font-bold text-sky-900 pt-0.5">
              계산된 강의료: ₩ {Number(totalFee).toLocaleString('ko-KR')}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              진행 형태 및 장소
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationType('online')}
                className={`py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  locationType === 'online'
                    ? 'bg-sky-500 text-white border-sky-500 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" /> 온라인 (Zoom / 웨비나)
              </button>
              <button
                type="button"
                onClick={() => setLocationType('offline')}
                className={`py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  locationType === 'offline'
                    ? 'bg-sky-500 text-white border-sky-500 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> 오프라인 (교육장)
              </button>
            </div>
            <input
              type="text"
              placeholder={locationType === 'online' ? 'Zoom 회의 링크 또는 온라인 강의실 주소' : '교육장 주소 및 강의실 호수'}
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Payment Status & Sync Options */}
          <div className="pt-1.5 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-400"
              />
              <span className="text-xs font-bold text-slate-700">
                입금 완료된 강의입니다 (입금 완료 처리)
              </span>
            </label>

            {isGoogleConnected && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncToGCal}
                  onChange={(e) => setSyncToGCal(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> 구글 캘린더에도 이 일정을 즉시 등록합니다
                </span>
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-0.5">
              메모
            </label>
            <textarea
              rows={2}
              placeholder="담당자 연락처, 강의 준비물 등을 기록하세요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              {initialLecture ? '수정 완료' : '강의 등록'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};