import { test } from 'node:test';
import assert from 'node:assert/strict';
import { durationBetweenTimes, feeForMinutes, formatDuration, hoursToMinutes, isValidDuration, minutesToHours } from '../src/services/duration.ts';

test('minute conversion preserves short lectures and legacy hour values', () => {
  for (const minutes of [1, 5, 10, 20, 29, 30, 59, 60, 90, 360, 1440]) {
    assert.equal(hoursToMinutes(minutesToHours(minutes)), minutes);
    assert.equal(isValidDuration(minutes), true);
  }
  assert.equal(minutesToHours(10), 1 / 6);
  assert.equal(hoursToMinutes(0.5), 30);
  assert.equal(hoursToMinutes(1.5), 90);
});

test('time fields retain exact minutes instead of rounding to tenths of an hour', () => {
  assert.equal(durationBetweenTimes('10:00', '10:10'), 10);
  assert.equal(durationBetweenTimes('10:59', '11:00'), 1);
  assert.equal(durationBetweenTimes('10:00', '11:30'), 90);
  for (const [start, end] of [['10:00', '10:00'], ['11:00', '10:00'], ['', '10:00'], ['25:00', '26:00']]) {
    assert.equal(durationBetweenTimes(start, end), null);
  }
});

test('hourly fee is calculated at minute precision and rounded only to won', () => {
  assert.equal(feeForMinutes(1800000, 10), 300000);
  assert.equal(feeForMinutes(200000, 10), 33333);
  assert.equal(feeForMinutes(200000, 30), 100000);
  assert.equal(feeForMinutes(200000, 90), 300000);
});

test('duration validation rejects zero, negative, fractional and non-finite minutes', () => {
  for (const value of [0, -1, 0.5, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(isValidDuration(value), false);
  }
});

test('display shows readable hours and minutes without long decimals', () => {
  assert.equal(formatDuration(1 / 6), '10분');
  assert.equal(formatDuration(0.5), '30분');
  assert.equal(formatDuration(1.5), '1시간 30분');
  assert.equal(formatDuration(6), '6시간');
  assert.equal(formatDuration(1 / 6 + 0.5), '40분');
  assert.equal(formatDuration(0), '0분');
});
