import React, { useMemo, useState } from 'react';
import { Search, Check, Clock3, Pencil, Trash2, MapPin, Monitor, SlidersHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Lecture } from '../types/lecture';

interface LectureListProps {
  lectures: Lecture[];
  onEdit: (lecture: Lecture) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

export const LectureList: React.FC<LectureListProps> = ({ lectures, onEdit, onDelete, onTogglePaid }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'fee-desc' | 'fee-asc'>('date-desc');

  const agencies = useMemo(() => Array.from(new Set(lectures.map(item => item.agency).filter(Boolean))).sort(), [lectures]);
  const paidCount = lectures.filter(item => item.isPaid).length;

  const filteredLectures = useMemo(() => lectures
    .filter(item => {
      const keyword = searchTerm.toLowerCase();
      const matchesSearch = item.title.toLowerCase().includes(keyword)
        || item.agency?.toLowerCase().includes(keyword)
        || item.locationDetail?.toLowerCase().includes(keyword)
        || item.notes?.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'paid' ? item.isPaid : !item.isPaid);
      return matchesSearch && matchesStatus && (agencyFilter === 'all' || item.agency === agencyFilter);
    })
    .sort((a, b) => {
      if (sortOrder === 'date-desc') return b.date.localeCompare(a.date);
      if (sortOrder === 'date-asc') return a.date.localeCompare(b.date);
      if (sortOrder === 'fee-desc') return b.totalFee - a.totalFee;
      return a.totalFee - b.totalFee;
    }), [lectures, searchTerm, statusFilter, agencyFilter, sortOrder]);

  const filters = [
    { id: 'all' as const, label: '전체', count: lectures.length },
    { id: 'paid' as const, label: '입금 완료', count: paidCount },
    { id: 'pending' as const, label: '입금 대기', count: lectures.length - paidCount },
  ];

  return (
    <section>
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-[#89877e]">LEDGER ENTRIES</p>
          <div className="mt-1 flex items-end gap-3">
            <h2 className="text-2xl font-black tracking-[-0.055em] text-[#171916] sm:text-3xl">강의 기록</h2>
            <span className="mb-1 text-xs font-bold text-[#89877e]">{filteredLectures.length} ENTRIES</span>
          </div>
        </div>
        <div className="relative w-full lg:w-[360px]">
          <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77766e]" />
          <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="강의, 업체, 장소 검색"
            className="w-full border-0 border-b border-[#aaa69b] bg-transparent py-2.5 pl-7 pr-2 text-sm font-semibold text-[#171916] outline-none placeholder:font-medium placeholder:text-[#9b998f] focus:border-[#171916]" />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-3 border-y border-[#d4d0c4] py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5 overflow-x-auto">
          {filters.map(filter => (
            <button key={filter.id} onClick={() => setStatusFilter(filter.id)}
              className={`whitespace-nowrap text-xs font-black transition ${statusFilter === filter.id ? 'text-[#171916]' : 'text-[#99978e] hover:text-[#55564f]'}`}>
              {filter.label} <span className={statusFilter === filter.id ? 'ml-1 text-[#69735f]' : 'ml-1'}>{filter.count}</span>
              {statusFilter === filter.id && <span className="mt-2 block h-[2px] bg-[#171916]" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#89877e]" />
          {agencies.length > 0 && <select value={agencyFilter} onChange={event => setAgencyFilter(event.target.value)} className="max-w-[150px] bg-transparent text-xs font-bold text-[#66675f] outline-none"><option value="all">모든 업체</option>{agencies.map(agency => <option key={agency} value={agency}>{agency}</option>)}</select>}
          <span className="h-4 w-px bg-[#c8c4b8]" />
          <select value={sortOrder} onChange={event => setSortOrder(event.target.value as typeof sortOrder)} className="bg-transparent text-xs font-bold text-[#66675f] outline-none">
            <option value="date-desc">최신순</option><option value="date-asc">오래된순</option><option value="fee-desc">금액 높은순</option><option value="fee-asc">금액 낮은순</option>
          </select>
        </div>
      </div>

      {filteredLectures.length === 0 ? (
        <div className="border-b border-[#d4d0c4] py-24 text-center"><p className="text-lg font-black text-[#171916]">조건에 맞는 기록이 없습니다.</p><p className="mt-2 text-xs text-[#89877e]">검색어나 필터를 바꿔보세요.</p></div>
      ) : (
        <div className="border-t border-[#171916]">
          <div className="hidden grid-cols-12 gap-4 border-b border-[#d4d0c4] px-3 py-3 text-[9px] font-black tracking-[0.13em] text-[#89877e] md:grid">
            <div className="col-span-2">DATE / TIME</div><div className="col-span-5">LECTURE</div><div className="col-span-2">PLACE</div><div className="col-span-2 text-right">FEE</div><div className="col-span-1 text-right">STATUS</div>
          </div>
          {filteredLectures.map((lecture, index) => {
            const date = parseISO(lecture.date);
            return (
              <article key={lecture.id} className="group relative border-b border-[#d4d0c4] transition hover:bg-[#f8f6ef]">
                <span className="absolute inset-y-0 left-0 w-0 bg-[#8c7761] transition-all group-hover:w-1" />
                <div className="hidden grid-cols-12 items-center gap-4 px-3 py-5 md:grid">
                  <div className="col-span-2 flex items-center gap-3"><span className="text-[9px] font-bold text-[#aaa79d]">{String(index + 1).padStart(2, '0')}</span><div><p className="text-sm font-black text-[#171916]">{format(date, 'M월 d일')}</p><p className="mt-1 text-[10px] font-semibold text-[#89877e]">{format(date, 'EEE', { locale: ko })} · {lecture.startTime}—{lecture.endTime} · {lecture.durationHours}H</p></div></div>
                  <div className="col-span-5 min-w-0"><p className="truncate text-[15px] font-black tracking-[-0.025em] text-[#171916]">{lecture.title}</p><p className="mt-1.5 truncate text-[10px] font-bold tracking-[0.04em] text-[#77766e]">{lecture.agency || 'DIRECT LECTURE'}{lecture.notes ? ` · ${lecture.notes}` : ''}</p></div>
                  <div className="col-span-2 min-w-0"><p className="flex items-center gap-1.5 text-[11px] font-bold text-[#55564f]">{lecture.locationType === 'online' ? <Monitor className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}<span className="truncate">{lecture.locationDetail || (lecture.locationType === 'online' ? '온라인' : '장소 미입력')}</span></p></div>
                  <div className="col-span-2 text-right"><p className="text-base font-black tracking-[-0.035em] text-[#171916]">₩{lecture.totalFee.toLocaleString('ko-KR')}</p><p className="mt-1 text-[9px] font-semibold text-[#99978e]">시간당 ₩{lecture.durationHours ? Math.round(lecture.totalFee / lecture.durationHours).toLocaleString('ko-KR') : 0}</p></div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button onClick={() => onTogglePaid(lecture.id)} title="입금 상태 변경" className={`grid h-8 w-8 place-items-center border transition ${lecture.isPaid ? 'border-[#171916] bg-[#171916] text-[#d8c7a8]' : 'border-[#bc7664] text-[#9b513e] hover:bg-[#f4ddd6]'}`}>{lecture.isPaid ? <Check className="h-4 w-4" /> : <Clock3 className="h-3.5 w-3.5" />}</button>
                    <div className="hidden items-center gap-1 group-hover:flex"><button onClick={() => onEdit(lecture)} className="grid h-8 w-8 place-items-center text-[#77766e] hover:bg-white hover:text-black" title="수정"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => onDelete(lecture.id)} className="grid h-8 w-8 place-items-center text-[#aaa79d] hover:bg-[#f4ddd6] hover:text-[#9b513e]" title="삭제"><Trash2 className="h-3.5 w-3.5" /></button></div>
                  </div>
                </div>

                <div className="px-1 py-5 md:hidden">
                  <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[10px] font-black tracking-[0.08em] text-[#77766e]">{format(date, 'M월 d일 EEE', { locale: ko }).toUpperCase()} · {lecture.startTime}—{lecture.endTime}</p><h3 className="mt-2 text-base font-black leading-snug tracking-[-0.035em] text-[#171916]">{lecture.title}</h3><p className="mt-1.5 truncate text-[11px] font-semibold text-[#77766e]">{lecture.agency || '직접 출강'}</p></div><p className="shrink-0 text-base font-black tracking-[-0.04em] text-[#171916]">₩{lecture.totalFee.toLocaleString('ko-KR')}</p></div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#dedacf] pt-3"><p className="flex min-w-0 items-center gap-1.5 truncate text-[10px] font-semibold text-[#89877e]">{lecture.locationType === 'online' ? <Monitor className="h-3 w-3 shrink-0" /> : <MapPin className="h-3 w-3 shrink-0" />}{lecture.locationDetail || (lecture.locationType === 'online' ? '온라인' : '장소 미입력')} · {lecture.durationHours}H</p><div className="ml-3 flex shrink-0 items-center gap-1"><button onClick={() => onTogglePaid(lecture.id)} className={`px-2.5 py-1.5 text-[10px] font-black ${lecture.isPaid ? 'bg-[#171916] text-[#d8c7a8]' : 'border border-[#bc7664] text-[#9b513e]'}`}>{lecture.isPaid ? '입금 완료' : '입금 대기'}</button><button onClick={() => onEdit(lecture)} className="p-2 text-[#77766e]"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => onDelete(lecture.id)} className="p-2 text-[#a45e4c]"><Trash2 className="h-3.5 w-3.5" /></button></div></div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
