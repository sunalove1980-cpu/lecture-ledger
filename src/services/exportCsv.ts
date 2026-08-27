import type { Lecture } from '../types/lecture';

export function exportToCsv(lectures: Lecture[], filename = '강의료_정산내역'): void {
  if (!lectures || lectures.length === 0) {
    alert('내보낼 강의 데이터가 없습니다.');
    return;
  }

  // Define Headers in Korean
  const headers = [
    '강의일자',
    '시작시간',
    '종료시간',
    '강의시간(시간)',
    '강의명/주제',
    '위탁/중개업체',
    '강의료(원)',
    '입금상태',
    '입금확인일',
    '진행방식',
    '장소 및 상세링크',
    '메모'
  ];

  // Helper to escape CSV cell
  const escapeCell = (str: string | undefined) => {
    if (!str) return '""';
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Map rows
  const rows = lectures.map(item => [
    item.date,
    item.startTime,
    item.endTime,
    item.durationHours.toString(),
    escapeCell(item.title),
    escapeCell(item.agency),
    item.totalFee.toString(),
    item.isPaid ? '입금 완료' : '미입금 (대기)',
    item.paidDate || '-',
    item.locationType === 'online' ? '온라인' : '오프라인',
    escapeCell(item.locationDetail),
    escapeCell(item.notes)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  // Add UTF-8 BOM (\uFEFF) to prevent Excel from displaying broken Korean text
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

