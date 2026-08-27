import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, CheckCircle2, Clock } from 'lucide-react';
import type { Lecture } from '../types/lecture';

import { getAgencyColor } from '../services/storage';

interface LectureCalendarProps {
  currentMonth: Date;
  lectures: Lecture[];
  onSelectLecture: (lecture: Lecture) => void;
  onAddNewAtDate: (dateStr: string) => void;
}

export const LectureCalendar: React.FC<LectureCalendarProps> = ({
  currentMonth,
  lectures,
  onSelectLecture,
  onAddNewAtDate,
}) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const getLecturesForDay = (day: Date): Lecture[] => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return lectures.filter(l => l.date === dayStr);
  };

  const selectedDayLectures = selectedDay ? getLecturesForDay(selectedDay) : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Calendar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            강의 캘린더
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            날짜를 클릭하여 해당 일자의 강의를 확인하거나 새 일정을 등록할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            입금완료
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            입금대기
          </span>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-xs font-semibold text-slate-500">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`py-2.5 ${idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
        {days.map((day, dayIdx) => {
          const dayLectures = getLecturesForDay(day);
          const isCurrMonth = isSameMonth(day, monthStart);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isTodayDate = isToday(day);
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTotalFee = dayLectures.reduce((s, l) => s + (l.totalFee || 0), 0);

          return (
            <div
              key={dayIdx}
              onClick={() => setSelectedDay(day)}
              className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                !isCurrMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white hover:bg-indigo-50/30'
              } ${isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/20' : ''}`}
            >
              {/* Day Number and Quick Add */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isTodayDate
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isCurrMonth
                      ? day.getDay() === 0
                        ? 'text-rose-500'
                        : day.getDay() === 6
                        ? 'text-blue-500'
                        : 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Day Total Fee on Desktop */}
                {dayLectures.length > 0 && isCurrMonth && (
                  <span className="hidden lg:inline-block text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    ₩{(dayTotalFee / 10000).toFixed(0)}만
                  </span>
                )}

                {/* Add button on hover */}
                {isCurrMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNewAtDate(dayStr);
                    }}
                    title="이 날짜에 강의 추가"
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 rounded transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lecture Event Badges */}
              <div className="space-y-1 my-1 overflow-hidden">
                {dayLectures.slice(0, 2).map((lec) => {
                  const agencyColor = getAgencyColor(lec.agency);
                  return (
                    <div
                      key={lec.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLecture(lec);
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-slate-800 truncate border transition-all hover:scale-[1.02] flex items-center gap-1 shadow-2xs"
                      style={{
                        backgroundColor: `${agencyColor}15`,
                        borderColor: `${agencyColor}40`,
                      }}
                      title={`${lec.agency ? `[${lec.agency}] ` : ''}${lec.title} (₩${lec.totalFee.toLocaleString('ko-KR')})`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: agencyColor }}
                      />
                      <span className="truncate flex-1 font-semibold">
                        {lec.title}
                      </span>
                    </div>
                  );
                })}

                {dayLectures.length > 2 && (
                  <div className="text-[10px] font-semibold text-indigo-600 px-1">
                    +{dayLectures.length - 2}개 더보기
                  </div>
                )}
              </div>

              {/* Mobile indicators */}
              <div className="sm:hidden flex items-center gap-0.5">
                {dayLectures.map((l) => (
                  <span
                    key={l.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getAgencyColor(l.agency) }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Drawer / Detail Panel (Below calendar) */}
      {selectedDay && (
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800">
                {format(selectedDay, 'yyyy년 M월 d일 (EEEE)', { locale: ko })} 강의 일정
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                ({selectedDayLectures.length}건)
              </span>
            </div>
            <button
              onClick={() => onAddNewAtDate(format(selectedDay, 'yyyy-MM-dd'))}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50"
            >
              <Plus className="w-3.5 h-3.5" />
              이 날짜에 강의 추가
            </button>
          </div>

          {selectedDayLectures.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              등록된 강의 일정이 없습니다. 우측 버튼을 눌러 일정을 추가해 보세요.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDayLectures.map((lec) => {
                const agencyColor = getAgencyColor(lec.agency);
                return (
                  <div
                    key={lec.id}
                    onClick={() => onSelectLecture(lec)}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: agencyColor }}
                      >
                        {lec.agency || '직접 출강'}
                      </span>
                      <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                        lec.isPaid ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {lec.isPaid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> 입금완료
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> 입금대기
                          </>
                        )}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                      {lec.title}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span>{lec.startTime} ~ {lec.endTime} ({lec.durationHours}시간)</span>
                      <span className="font-bold text-indigo-600 text-sm">
                        ₩ {lec.totalFee.toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};