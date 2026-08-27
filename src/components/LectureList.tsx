import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  Laptop, 
  Building2, 
  AlertCircle
} from 'lucide-react';
import type { Lecture } from '../types/lecture';
import { getAgencyColor } from '../services/storage';

interface LectureListProps {
  lectures: Lecture[];
  onEdit: (lecture: Lecture) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

export const LectureList: React.FC<LectureListProps> = ({
  lectures,
  onEdit,
  onDelete,
  onTogglePaid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'fee-desc' | 'fee-asc'>('date-desc');

  // Extract unique agencies for filter dropdown
  const agencies = useMemo(() => {
    const list = Array.from(new Set(lectures.map(l => l.agency).filter(Boolean)));
    return list.sort();
  }, [lectures]);

  // Filter & sort
  const filteredLectures = useMemo(() => {
    return lectures
      .filter((lec) => {
        const matchesSearch =
          lec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lec.agency && lec.agency.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (lec.locationDetail && lec.locationDetail.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (lec.notes && lec.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'paid'
            ? lec.isPaid
            : !lec.isPaid;

        const matchesAgency =
          agencyFilter === 'all' ? true : lec.agency === agencyFilter;

        return matchesSearch && matchesStatus && matchesAgency;
      })
      .sort((a, b) => {
        if (sortOrder === 'date-desc') return b.date.localeCompare(a.date);
        if (sortOrder === 'date-asc') return a.date.localeCompare(b.date);
        if (sortOrder === 'fee-desc') return (b.totalFee || 0) - (a.totalFee || 0);
        if (sortOrder === 'fee-asc') return (a.totalFee || 0) - (b.totalFee || 0);
        return 0;
      });
  }, [lectures, searchTerm, statusFilter, agencyFilter, sortOrder]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              강의 목록 및 정산 관리
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              총 {filteredLectures.length}개의 강의 내역
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="강의명, 업체명, 장소 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          
          {/* Status Tabs */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              전체 ({lectures.length})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              입금 완료 ({lectures.filter(l => l.isPaid).length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              입금 대기 ({lectures.filter(l => !l.isPaid).length})
            </button>
          </div>

          {/* Agency Filter */}
          {agencies.length > 0 && (
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">모든 업체</option>
              {agencies.map(agency => (
                <option key={agency} value={agency}>{agency}</option>
              ))}
            </select>
          )}

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium ml-auto focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="date-desc">최신 날짜순</option>
            <option value="date-asc">오래된 날짜순</option>
            <option value="fee-desc">강의료 높은순</option>
            <option value="fee-asc">강의료 낮은순</option>
          </select>

        </div>
      </div>

      {/* Content */}
      {filteredLectures.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">검색 조건에 맞는 강의가 없습니다</h4>
          <p className="text-xs text-slate-400 mt-1">검색어나 필터를 재설정해 보세요.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/70 text-xs font-semibold text-slate-500">
            <div className="col-span-2">일시 / 시간</div>
            <div className="col-span-4">강의명 / 위탁업체</div>
            <div className="col-span-2">진행 형태 / 장소</div>
            <div className="col-span-2 text-right">강의료</div>
            <div className="col-span-2 text-center">입금상태 / 관리</div>
          </div>

          {/* Items */}
          {filteredLectures.map((lec) => {
            const agencyColor = getAgencyColor(lec.agency);

            return (
              <div
                key={lec.id}
                className="p-4 sm:px-6 sm:py-4 hover:bg-slate-50/80 transition-colors"
              >
                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  
                  {/* Date & Time */}
                  <div className="col-span-2 space-y-0.5">
                    <div className="text-sm font-bold text-slate-900">
                      {lec.date}
                    </div>
                    <div className="text-xs text-slate-500">
                      {lec.startTime} ~ {lec.endTime} ({lec.durationHours}h)
                    </div>
                  </div>

                  {/* Title & Agency */}
                  <div className="col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: agencyColor }}
                      >
                        {lec.agency || '직접 출강'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 leading-snug">
                      {lec.title}
                    </div>
                    {lec.notes && (
                      <div className="text-xs text-slate-400 truncate max-w-sm">
                        메모: {lec.notes}
                      </div>
                    )}
                  </div>

                  {/* Format & Location */}
                  <div className="col-span-2 space-y-1 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {lec.locationType === 'online' ? (
                        <>
                          <Laptop className="w-3 h-3 text-indigo-500" /> 온라인
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3 text-emerald-500" /> 오프라인
                        </>
                      )}
                    </span>
                    {lec.locationDetail && (
                      <div className="text-slate-500 truncate" title={lec.locationDetail}>
                        {lec.locationDetail}
                      </div>
                    )}
                  </div>

                  {/* Fee */}
                  <div className="col-span-2 text-right">
                    <div className="text-base font-extrabold text-slate-900 tracking-tight">
                      ₩ {lec.totalFee.toLocaleString('ko-KR')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      시간당 ₩ {lec.durationHours > 0 ? Math.round(lec.totalFee / lec.durationHours).toLocaleString('ko-KR') : 0}
                    </div>
                  </div>

                  {/* Actions & Paid Toggle */}
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => onTogglePaid(lec.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                        lec.isPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title="클릭하여 입금 상태 변경"
                    >
                      {lec.isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          입금완료
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          입금대기
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onEdit(lec)}
                      title="수정"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(lec.id)}
                      title="삭제"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white inline-block"
                        style={{ backgroundColor: agencyColor }}
                      >
                        {lec.agency || '직접 출강'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {lec.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-slate-900">
                        ₩ {lec.totalFee.toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div>
                      {lec.date} · {lec.startTime}~{lec.endTime} ({lec.durationHours}h)
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      {lec.locationType === 'online' ? '온라인' : '오프라인'}
                      {lec.locationDetail && ` · ${lec.locationDetail}`}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onTogglePaid(lec.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border ${
                        lec.isPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {lec.isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {lec.isPaid ? '입금완료' : '입금대기'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(lec)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> 수정
                      </button>
                      <button
                        onClick={() => onDelete(lec.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 bg-slate-100 rounded-lg text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
};