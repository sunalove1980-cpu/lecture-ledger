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

  // Calculate duration from start and end time
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
      // Default new lecture
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialLecture ? '강의 일정 수정' : '새 강의 일정 등록'}
              </h3>
              <p className="text-xs text-slate-500">
                강의 상세 및 정산 정보를 입력하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              강의명 / 주제 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 실무 AI 프롬프트 엔지니어링 워크숍"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Agency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              위탁 / 중개 업체명 (기관)
            </label>
            <input
              type="text"
              placeholder="예: 패스트캠퍼스, 러닝스푼즈, 기업 직접 출강 등"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all mb-2"
            />
            {/* Quick agency chips */}
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_AGENCIES.slice(0, 6).map((popAgency) => (
                <button
                  type="button"
                  key={popAgency}
                  onClick={() => setAgency(popAgency)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    agency === popAgency
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {popAgency}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                강의 날짜 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                시작 시간
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                종료 시간
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Duration & Fee Section */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-indigo-600" />
                강의 시간 및 강의료 설정
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-indigo-100 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setFeeMode('total')}
                  className={`px-2 py-0.5 rounded ${feeMode === 'total' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                >
                  총액 직접입력
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFeeMode('hourly');
                    setTotalFee(Math.round(hourlyRate * durationHours));
                  }}
                  className={`px-2 py-0.5 rounded ${feeMode === 'hourly' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                >
                  시급 계산
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                />
              </div>

              {feeMode === 'hourly' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    시간당 단가 (원)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={hourlyRate}
                    onChange={(e) => handleHourlyRateChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    총 강의료 (원)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={totalFee}
                    onChange={(e) => setTotalFee(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-indigo-700"
                  />
                </div>
              )}
            </div>

            <div className="text-right text-xs font-bold text-indigo-900">
              최종 계산 강의료: ₩ {Number(totalFee).toLocaleString('ko-KR')}
            </div>
          </div>

          {/* Location Type & Details */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              진행 형태 및 장소
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationType('online')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  locationType === 'online'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Laptop className="w-4 h-4" /> 온라인 (Zoom / 웨비나)
              </button>
              <button
                type="button"
                onClick={() => setLocationType('offline')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  locationType === 'offline'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" /> 오프라인 (교육장)
              </button>
            </div>
            <input
              type="text"
              placeholder={locationType === 'online' ? 'Zoom 회의 링크 또는 온라인 강의실 주소' : '교육장 주소 및 강의실 호수'}
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Payment Status & Sync Options */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-800">
                이미 입금이 완료된 강의입니다 (입금 완료 처리)
              </span>
            </label>

            {isGoogleConnected && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncToGCal}
                  onChange={(e) => setSyncToGCal(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> 구글 캘린더에도 이 일정을 즉시 등록합니다
                </span>
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              메모 및 준비물
            </label>
            <textarea
              rows={2}
              placeholder="담당자 연락처, 교재, 강의 준비물 등을 기록하세요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {initialLecture ? '수정 완료' : '강의 등록'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};