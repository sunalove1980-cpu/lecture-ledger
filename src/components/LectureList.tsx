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

  const agencies = useMemo(() => {
    const list = Array.from(new Set(lectures.map(l => l.agency).filter(Boolean)));
    return list.sort();
  }, [lectures]);

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
    <div className="bg-[#f8f6ef] border border-[#d4d0c4] overflow-hidden">
      
      {/* Controls Header */}
      <div className="p-4 sm:p-5 border-b border-[#d4d0c4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-[-0.04em] text-[#171916]">
              강의 목록 및 정산 내역
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              총 {filteredLectures.length}개의 강의가 조회되었습니다
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="강의명, 업체명, 장소 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#eeeadf] border border-[#cec9bd] text-[#171916] placeholder:text-[#98968d] focus:bg-white focus:outline-none focus:border-[#171916]"
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <div className="inline-flex p-0.5 bg-[#e9e4d7] text-xs font-semibold text-[#66675f]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-[#171916] text-white font-bold' : 'hover:text-[#171916]'
              }`}
            >
              전체 ({lectures.length})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'paid' ? 'bg-[#171916] text-[#d9ff57] font-bold' : 'hover:text-[#171916]'
              }`}
            >
              입금 완료 ({lectures.filter(l => l.isPaid).length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'pending' ? 'bg-[#171916] text-[#ffb49f] font-bold' : 'hover:text-[#171916]'
              }`}
            >
              입금 대기 ({lectures.filter(l => !l.isPaid).length})
            </button>
          </div>

          {agencies.length > 0 && (
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="text-xs py-1 px-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium focus:outline-none focus:border-gray-300"
            >
              <option value="all">모든 업체</option>
              {agencies.map(agency => (
                <option key={agency} value={agency}>{agency}</option>
              ))}
            </select>
          )}

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="text-xs py-1 px-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium ml-auto focus:outline-none focus:border-gray-300"
          >
            <option value="date-desc">최신순</option>
            <option value="date-asc">오래된순</option>
            <option value="fee-desc">강의료 높은순</option>
            <option value="fee-asc">강의료 낮은순</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredLectures.length === 0 ? (
        <div className="p-10 text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-gray-700">해당 조건의 강의가 없습니다</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">검색어나 필터를 변경해 보세요.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          
          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-[#e9e4d7] text-[10px] font-black tracking-[0.08em] text-[#77766e]">
            <div className="col-span-2">일시 / 시간</div>
            <div className="col-span-4">강의명 / 위탁업체</div>
            <div className="col-span-2">진행 형태 / 장소</div>
            <div className="col-span-2 text-right">강의료</div>
            <div className="col-span-2 text-center">정산상태 / 관리</div>
          </div>

          {/* Items */}
          {filteredLectures.map((lec) => {
            const agencyColor = getAgencyColor(lec.agency);

            return (
              <div
                key={lec.id}
                className="p-3.5 sm:px-5 sm:py-4 hover:bg-white transition-colors"
              >
                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  
                  {/* Date */}
                  <div className="col-span-2 space-y-0.5">
                    <div className="text-xs font-bold text-gray-900">
                      {lec.date}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {lec.startTime}~{lec.endTime} ({lec.durationHours}h)
                    </div>
                  </div>

                  {/* Title & Agency */}
                  <div className="col-span-4 space-y-1">
                    <div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-none"
                        style={{ backgroundColor: agencyColor }}
                      >
                        {lec.agency || '직접 출강'}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                      {lec.title}
                    </div>
                    {lec.notes && (
                      <div className="text-[11px] text-gray-400 truncate max-w-sm">
                        메모: {lec.notes}
                      </div>
                    )}
                  </div>

                  {/* Format */}
                  <div className="col-span-2 space-y-1 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium text-[11px]">
                      {lec.locationType === 'online' ? (
                        <>
                          <Laptop className="w-3 h-3 text-blue-600" /> 온라인
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3 text-gray-600" /> 오프라인
                        </>
                      )}
                    </span>
                    {lec.locationDetail && (
                      <div className="text-[11px] text-gray-500 truncate" title={lec.locationDetail}>
                        {lec.locationDetail}
                      </div>
                    )}
                  </div>

                  {/* Fee */}
                  <div className="col-span-2 text-right">
                    <div className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                      ₩ {lec.totalFee.toLocaleString('ko-KR')}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      시급 약 ₩{lec.durationHours > 0 ? Math.round(lec.totalFee / lec.durationHours).toLocaleString('ko-KR') : 0}
                    </div>
                  </div>

                  {/* Actions & Paid Toggle */}
                  <div className="col-span-2 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onTogglePaid(lec.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
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
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(lec.id)}
                      title="삭제"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* Mobile Card */}
                <div className="md:hidden space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white inline-block shadow-none"
                        style={{ backgroundColor: agencyColor }}
                      >
                        {lec.agency || '직접 출강'}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                        {lec.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-gray-900">
                        ₩ {lec.totalFee.toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-gray-100">
                    <div>
                      {lec.date} · {lec.startTime}~{lec.endTime} ({lec.durationHours}h)
                    </div>
                    <div className="text-gray-600">
                      {lec.locationType === 'online' ? '온라인' : '오프라인'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onTogglePaid(lec.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border ${
                        lec.isPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {lec.isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                      {lec.isPaid ? '입금완료' : '입금대기'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(lec)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium flex items-center gap-0.5"
                      >
                        <Edit3 className="w-3 h-3" /> 수정
                      </button>
                      <button
                        onClick={() => onDelete(lec.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 bg-gray-100 rounded-lg text-xs font-medium"
                      >
                        <Trash2 className="w-3 h-3" />
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
