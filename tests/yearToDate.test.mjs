import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { getKoreanToday, summarizeYearToDate } from '../src/services/yearToDate.ts';
import { parseGEventsToLectures } from '../src/services/googleCalendar.ts';
import { appendCalendarLectures } from '../src/services/storage.ts';

const lecture = (date, totalFee, isPaid = false, extra = {}) => ({ date, totalFee, isPaid, ...extra });

test('includes Jan 1 and all of today; excludes tomorrow, later this year and other years', () => {
  const result = summarizeYearToDate([
    lecture('2025-12-31', 900), lecture('2026-01-01', 100, true),
    lecture('2026-10-13', 200, false, { startTime: '23:00' }),
    lecture('2026-10-14', 900), lecture('2026-12-31', 900, true), lecture('2027-01-01', 900),
  ], '2026-10-13');
  assert.deepEqual(result, {
    startDate: '2026-01-01', endDate: '2026-10-13', totalEarnings: 300,
    paidEarnings: 100, pendingEarnings: 200, invalidFeeCount: 0,
  });
});

test('empty year is zero; Dec 31 includes the whole completed year', () => {
  assert.equal(summarizeYearToDate([], '2026-01-01').totalEarnings, 0);
  assert.equal(summarizeYearToDate([lecture('2026-12-31', 100)], '2026-12-31').totalEarnings, 100);
});

test('Korean midnight and year rollover are independent of the browser timezone', () => {
  for (const zone of ['UTC', 'Asia/Seoul', 'America/Los_Angeles']) {
    const source = `
      import assert from 'node:assert/strict';
      import { getKoreanToday, summarizeYearToDate } from './src/services/yearToDate.ts';
      assert.equal(getKoreanToday(new Date('2026-12-31T14:59:59.999Z')), '2026-12-31');
      assert.equal(getKoreanToday(new Date('2026-12-31T15:00:00.000Z')), '2027-01-01');
      assert.equal(getKoreanToday(new Date('2026-10-12T15:00:00Z')), '2026-10-13');
      const rows = [{ date: '2026-12-31', totalFee: 100 }, { date: '2027-01-01', totalFee: 200 }];
      assert.equal(summarizeYearToDate(rows, getKoreanToday(new Date('2026-12-31T15:00:00Z'))).totalEarnings, 200);
    `;
    const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', source], {
      cwd: new URL('..', import.meta.url), env: { ...process.env, TZ: zone }, encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${zone}: ${result.stderr}`);
  }
  assert.equal(getKoreanToday(new Date('2026-10-13T14:59:59Z')), '2026-10-13');
});

test('valid leap days count; invalid and non-date strings do not normalize into the period', () => {
  const rows = ['2024-02-29', '2024-02-30', '2024-04-31', '2024-00-01', '2024-13-01',
    '2024-1-01', '2024-01-01T00:00:00Z', 'invalid', '', null, undefined].map(date => lecture(date, 100));
  assert.equal(summarizeYearToDate(rows, '2024-12-31').totalEarnings, 100);
  assert.equal(summarizeYearToDate([lecture('2026-02-29', 100)], '2026-12-31').totalEarnings, 0);
});

test('uses lecture date and current payment flag, never payment or creation date', () => {
  const rows = [
    lecture('2026-01-01', 10, true, { paidDate: '2025-12-30', createdAt: '2025-01-01' }),
    lecture('2026-01-02', 20, false, { paidDate: '2026-01-02' }),
    lecture('2025-12-31', 100, true, { paidDate: '2026-01-01' }),
    lecture('2026-12-31', 100, true, { paidDate: '2026-01-01' }),
  ];
  const result = summarizeYearToDate(rows, '2026-10-13');
  assert.equal(result.paidEarnings, 10);
  assert.equal(result.pendingEarnings, 20);
  assert.equal(result.totalEarnings, 30);
});

test('preserves legacy decimals, zero and signed amounts without Calendar integer validation', () => {
  const result = summarizeYearToDate([
    lecture('2026-01-01', 100.25, true), lecture('2026-01-01', 50.5),
    lecture('2026-01-01', -10), lecture('2026-01-01', 0),
  ], '2026-10-13');
  assert.equal(result.totalEarnings, 140.75);
  assert.equal(result.paidEarnings, 100.25);
  assert.equal(result.pendingEarnings, 40.5);
  assert.equal(result.invalidFeeCount, 0);
});

test('malformed fees are disclosed and excluded without string coercion or NaN poisoning', () => {
  const invalid = [NaN, Infinity, -Infinity, undefined, null, '100', '', '미정', {}, true];
  const rows = invalid.map(fee => lecture('2026-01-01', fee));
  const result = summarizeYearToDate([...rows, lecture('2026-01-01', 25.5), lecture('2027-01-01', 'bad')], '2026-10-13');
  assert.equal(result.totalEarnings, 25.5);
  assert.equal(result.invalidFeeCount, invalid.length);
});

test('summary is read-only, including notes, payment dates, unknown fields and order', () => {
  const rows = [
    lecture('2026-10-13', 500.5, true, { notes: '합성 메모', paidDate: '2026-10-13', extra: { legacy: true } }),
    lecture('2026-01-01', 100, false),
  ];
  const before = JSON.stringify(rows);
  Object.freeze(rows[0].extra);
  rows.forEach(Object.freeze);
  Object.freeze(rows);
  summarizeYearToDate(rows, '2026-10-13');
  assert.equal(JSON.stringify(rows), before);
});

test('Calendar decimal-unit conversion and invalid/undecided fee rejection remain unchanged', () => {
  const event = fee => ({
    id: 'synthetic', created: '2026-10-07T00:00:00+09:00', status: 'confirmed',
    summary: `[G] 10시~12시, 합성 강의, 테스트 기관, ${fee}`, description: '등록: 루미',
    start: { dateTime: '2026-10-13T10:00:00+09:00' }, end: { dateTime: '2026-10-13T12:00:00+09:00' },
  });
  const [parsed] = parseGEventsToLectures([event('1.5만원')]);
  assert.equal(parsed.totalFee, 15000);
  for (const fee of ['1.5원', '미정', '', '-100원']) {
    assert.throws(() => parseGEventsToLectures([event('1.5만원'), event(fee)]));
  }
  const original = JSON.stringify([lecture('2026-01-01', 123.45, true, { notes: '합성 메모' })], null, 2);
  const writes = [];
  globalThis.localStorage = { getItem: () => original, setItem: (...args) => writes.push(args) };
  try {
    assert.throws(() => appendCalendarLectures([{ ...parsed, totalFee: 1.5 }]));
    assert.deepEqual(writes, []);
    assert.equal(localStorage.getItem('lecture_fee_manager_lectures_v1'), original);
  } finally { delete globalThis.localStorage; }
});
