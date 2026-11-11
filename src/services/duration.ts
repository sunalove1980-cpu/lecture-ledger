// Keep stored durations in hours for compatibility with existing v1 records.
// Use whole minutes for input and display so short lectures never round to 0.1h.
export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

export function minutesToHours(minutes: number): number {
  return minutes / 60;
}

export function durationBetweenTimes(start: string, end: string): number | null {
  const time = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const startMatch = time.exec(start);
  const endMatch = time.exec(end);
  if (!startMatch || !endMatch) return null;
  const minutes = Number(endMatch[1]) * 60 + Number(endMatch[2])
    - Number(startMatch[1]) * 60 - Number(startMatch[2]);
  return minutes > 0 ? minutes : null;
}

export function isValidDuration(minutes: number): boolean {
  return Number.isSafeInteger(minutes) && minutes >= 1;
}

export function feeForMinutes(hourlyRate: number, minutes: number): number {
  return Math.round(hourlyRate * minutes / 60);
}

export function formatDuration(hours: number): string {
  const totalMinutes = Number.isFinite(hours) ? Math.max(0, hoursToMinutes(hours)) : 0;
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!wholeHours) return `${minutes}분`;
  return minutes ? `${wholeHours}시간 ${minutes}분` : `${wholeHours}시간`;
}
