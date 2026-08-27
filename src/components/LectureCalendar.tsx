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
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
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
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            강의 캘린더
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            날짜를 클릭하면 해당 일자의 강의를 확인하거나 새 일정을 등록할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            입금완료
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-300"></span>
            입금대기
          </span>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60 text-center text-xs font-semibold text-slate-500">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`py-2 ${idx === 0 ? 'text-rose-400 font-bold' : idx === 6 ? 'text-sky-500 font-bold' : ''}`}
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
              className={`min-h-[85px] sm:min-h-[105px] p-1.5 transition-all cursor-pointer relative group flex flex-col justify-between ${
                !isCurrMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white hover:bg-sky-50/20'
              } ${isSelected ? 'ring-2 ring-sky-400 ring-inset bg-sky-50/30' : ''}`}
            >
              {/* Day Number and Quick Add */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                    isTodayDate
                      ? 'bg-sky-500 text-white shadow-xs'
                      : isCurrMonth
                      ? day.getDay() === 0
                        ? 'text-rose-500'
                        : day.getDay() === 6
                        ? 'text-sky-500'
                        : 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {dayLectures.length > 0 && isCurrMonth && (
                  <span className="hidden lg:inline-block text-[10px] font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded">
                    ₩{(dayTotalFee / 10000).toFixed(0)}만
                  </span>
                )}

                {isCurrMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNewAtDate(dayStr);
                    }}
                    title="이 날짜에 강의 추가"
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-sky-600 rounded transition-opacity"
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
                      className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium text-slate-700 truncate border transition-all hover:scale-[1.01] flex items-center gap-1 shadow-2xs"
                      style={{
                        backgroundColor: `${agencyColor}14`,
                        borderColor: `${agencyColor}30`,
                      }}
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
                  <div className="text-[10px] font-semibold text-sky-600 px-1">
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

      {/* Selected Day Panel */}
      {selectedDay && (
        <div className="p-3.5 sm:p-4 bg-slate-50/70 border-t border-slate-200 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {format(selectedDay, 'yyyy년 M월 d일 (EEEE)', { locale: ko })} 강의 일정
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                ({selectedDayLectures.length}건)
              </span>
            </div>
            <button
              onClick={() => onAddNewAtDate(format(selectedDay, 'yyyy-MM-dd'))}
              className="flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs hover:bg-sky-50"
            >
              <Plus className="w-3 h-3" />
              이 날짜에 강의 추가
            </button>
          </div>

          {selectedDayLectures.length === 0 ? (
            <p className="text-[11px] text-slate-400 py-1">
              등록된 강의 일정이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {selectedDayLectures.map((lec) => {
                const agencyColor = getAgencyColor(lec.agency);
                return (
                  <div
                    key={lec.id}
                    onClick={() => onSelectLecture(lec)}
                    className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-sky-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: agencyColor }}
                      >
                        {lec.agency || '직접 출강'}
                      </span>
                      <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
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

                    <div className="font-bold text-xs sm:text-sm text-slate-800 leading-snug line-clamp-2">
                      {lec.title}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{lec.startTime}~{lec.endTime} ({lec.durationHours}h)</span>
                      <span className="font-bold text-sky-700">
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