import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createServer } from 'vite';

let server, App, YearToDateStats, createRoot;
before(async () => {
  // Let React detect real DOM input support before importing its client renderer.
  const bootstrap = new JSDOM('');
  globalThis.window = bootstrap.window;
  globalThis.document = bootstrap.window.document;
  ({ createRoot } = await import('react-dom/client'));
  bootstrap.window.close();
  delete globalThis.window;
  delete globalThis.document;
  server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  ({ App } = await server.ssrLoadModule('/src/App.tsx'));
  ({ YearToDateStats } = await server.ssrLoadModule('/src/components/YearToDateStats.tsx'));
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});
after(async () => { await server?.close(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

const key = 'lecture_fee_manager_lectures_v1';
const make = (id, date, totalFee, isPaid = false) => ({
  id, date, totalFee, isPaid, title: `합성 강의 ${id}`, agency: '테스트 기관', startTime: '10:00', endTime: '12:00',
  durationHours: 2, locationType: 'online', notes: '합성 메모 보존', paidDate: isPaid ? '2026-01-01' : undefined,
  createdAt: 'unchanged', updatedAt: 'unchanged', extra: { legacy: true },
});

async function mount(t, component, props = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test', pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.localStorage;
  });
  await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(component, props))));
  return { dom, root };
}

test('home total ignores month navigation and list search; all storage bytes and keys survive', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-13T03:00:00Z') });
  const rows = [make('jan', '2026-01-01', 100.25, true), make('today', '2026-10-13', 200.5),
    make('tomorrow', '2026-10-14', 900), make('old', '2025-12-31', 900)];
  const stored = new Map([[key, JSON.stringify(rows, null, 2)], [`${key}_before_lumi_append_v1`, 'synthetic backup'],
    ['lecture_fee_manager_google_config_v2', JSON.stringify({ isConnected: false, calendarId: 'primary', autoSync: true })]]);
  const original = new Map(stored);
  const writes = [];
  globalThis.localStorage = { getItem: k => stored.get(k) ?? null,
    setItem: (...args) => writes.push(args), removeItem: (...args) => writes.push(args), clear: () => writes.push('clear') };
  await mount(t, App);
  const card = () => document.querySelector('[aria-labelledby="year-to-date-title"]').textContent;
  const originalCard = card();
  assert.match(originalCard, /₩300.75/);
  assert.match(originalCard, /수령액₩100.25/);
  assert.match(originalCard, /미입금액₩200.5/);
  assert.match(originalCard, /2026.01.01 ~ 2026.10.13/);
  assert.match(originalCard, /강의일 기준 · 한국 시간 · 미래 강의 제외/);
  for (let i = 0; i < 12; i++) {
    await act(async () => document.querySelector('[aria-label="이전 달"]').click());
    assert.equal(card(), originalCard);
  }
  for (let i = 0; i < 12; i++) await act(async () => document.querySelector('[aria-label="다음 달"]').click());
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === '목록').click());
  const input = document.querySelector('input[placeholder="강의, 업체, 장소 검색"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, '없는 합성 검색어');
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  assert.match(document.body.textContent, /조건에 맞는 기록이 없습니다/);
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === '홈').click());
  assert.equal(card(), originalCard);
  await act(async () => window.dispatchEvent(new window.Event('focus')));
  assert.equal(card(), originalCard);
  assert.deepEqual(writes, []);
  assert.deepEqual(stored, original);
});

test('an open card rolls over at Korean midnight and refreshes after device sleep', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-12-31T14:59:59Z') });
  await mount(t, YearToDateStats, { lectures: [make('old', '2026-12-31', 100), make('new', '2027-01-01', 200)] });
  assert.match(document.body.textContent, /₩100/);
  // Only Date is mocked; let the already scheduled one-second timer fire.
  t.mock.timers.setTime(new Date('2026-12-31T15:00:00Z').getTime());
  await act(async () => new Promise(resolve => setTimeout(resolve, 1100)));
  assert.match(document.body.textContent, /2027.01.01 ~ 2027.01.01/);
  assert.match(document.body.textContent, /₩200/);
  t.mock.timers.setTime(new Date('2027-01-02T15:00:00Z').getTime());
  await act(async () => document.dispatchEvent(new window.Event('visibilitychange')));
  assert.match(document.body.textContent, /2027.01.01 ~ 2027.01.03/);
});

test('invalid fee notice is visible; saved decimal amounts are still rendered', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-13T03:00:00Z') });
  await mount(t, YearToDateStats, { lectures: [make('decimal', '2026-10-13', 123.45), make('bad', '2026-01-01', '미정')] });
  assert.match(document.body.textContent, /₩123.45/);
  assert.match(document.body.textContent, /금액을 확인할 수 없는 1건은 합계에서 제외/);
});
