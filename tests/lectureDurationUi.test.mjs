import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createServer } from 'vite';

let server, LectureModal, createRoot;
before(async () => {
  const bootstrap = new JSDOM('');
  globalThis.window = bootstrap.window;
  globalThis.document = bootstrap.window.document;
  ({ createRoot } = await import('react-dom/client'));
  bootstrap.window.close();
  delete globalThis.window;
  delete globalThis.document;
  server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  ({ LectureModal } = await server.ssrLoadModule('/src/components/LectureModal.tsx'));
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});
after(async () => { await server?.close(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

const sample = (hours = 1 / 6) => ({ id: 'synthetic-lecture', title: '합성 테스트 강의', agency: '테스트 기관',
  date: '2026-12-16', startTime: '10:00', endTime: '10:10', durationHours: hours, totalFee: 300000,
  isPaid: false, locationType: 'online', notes: '기존 메모', createdAt: 'unchanged', updatedAt: 'unchanged' });

async function mount(t, initialLecture = null) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test', pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  const root = createRoot(document.getElementById('root'));
  const saves = [], closes = [];
  const props = { isOpen: true, onClose: () => closes.push(true), onSave: (...args) => saves.push(args),
    defaultDate: '2026-12-16', initialLecture };
  const render = async changes => {
    Object.assign(props, changes);
    await act(async () => root.render(React.createElement(LectureModal, props)));
  };
  t.after(async () => {
    await act(async () => root.unmount()); dom.window.close();
    delete globalThis.window; delete globalThis.document;
  });
  await render({});
  return { render, saves, closes };
}

const hours = () => document.querySelector('[aria-label="총 강의 시간 (시간)"]');
const minutes = () => document.querySelector('[aria-label="총 강의 시간 (분)"]');
const fee = () => [...document.querySelectorAll('input[type="number"]')].at(-1);
const button = label => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === label);
async function set(input, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, String(value));
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}
async function submit() {
  const form = document.querySelector('form');
  assert.equal(form.checkValidity(), true);
  await act(async () => form.requestSubmit());
}

test('December 16 fixed-fee 10-minute lecture saves without minimum-30-minute restriction', async t => {
  const { saves } = await mount(t);
  await set(document.querySelector('input[type="text"]'), '합성 테스트 강의');
  await set(hours(), 0); await set(minutes(), 10); await set(fee(), 300000);
  await submit();
  assert.equal(saves.length, 1);
  assert.equal(saves[0][0].date, '2026-12-16');
  assert.equal(saves[0][0].durationHours, 10 / 60);
  assert.equal(saves[0][0].totalFee, 300000);
});

test('changing start/end times gives exact minutes and keeps manually entered total', async t => {
  const { saves } = await mount(t, sample());
  await set(document.querySelectorAll('input[type="time"]')[1], '10:01');
  assert.equal(hours().value, '0'); assert.equal(minutes().value, '1');
  assert.equal(fee().value, '300000');
  await set(document.querySelectorAll('input[type="time"]')[1], '10:10');
  assert.equal(minutes().value, '10');
  await submit();
  assert.equal(saves[0][0].durationHours, 1 / 6);
  assert.equal(saves[0][0].totalFee, 300000);
});

test('hourly fee and minute edits use precise duration; legacy 1.5 hours still calculates', async t => {
  const { saves } = await mount(t, sample());
  await act(async () => button('시급 계산').click());
  await set(fee(), 1800000);
  assert.match(document.body.textContent, /계산된 강의료: ₩ 300,000/);
  await submit();
  assert.equal(saves[0][0].totalFee, 300000);
  await set(fee(), 200000); await set(hours(), 1); await set(minutes(), 30);
  assert.match(document.body.textContent, /계산된 강의료: ₩ 300,000/);
  await submit();
  assert.equal(saves[1][0].durationHours, 1.5);
  assert.equal(saves[1][0].totalFee, 300000);
});

test('editing existing minute and half-hour records preserves duration, fee and notes', async t => {
  const original = sample();
  const snapshot = structuredClone(original);
  const { saves, render } = await mount(t, original);
  assert.equal(hours().value, '0'); assert.equal(minutes().value, '10');
  await submit();
  assert.equal(saves[0][0].durationHours, original.durationHours);
  assert.equal(saves[0][0].totalFee, original.totalFee);
  assert.equal(saves[0][0].notes, original.notes);
  assert.deepEqual(original, snapshot);
  await render({ initialLecture: sample(0.5) });
  assert.equal(minutes().value, '30');
  await submit();
  assert.equal(saves[1][0].durationHours, 0.5);
});

test('non-round hourly totals remain valid when switching back to direct input and reopening', async t => {
  const { saves, render } = await mount(t, sample());
  await act(async () => button('시급 계산').click());
  await set(fee(), 200000);
  assert.match(document.body.textContent, /계산된 강의료: ₩ 33,333/);
  await act(async () => button('총액 직접입력').click());
  await submit();
  assert.equal(saves[0][0].totalFee, 33333);
  await render({ initialLecture: { ...sample(), ...saves[0][0] } });
  await submit();
  assert.equal(saves[1][0].totalFee, 33333);
  assert.equal(saves[1][0].durationHours, 1 / 6);
});

test('zero duration is blocked, then one minute saves; negative/fractional fields are invalid', async t => {
  const { saves } = await mount(t, sample());
  await set(minutes(), 0); await submit();
  assert.equal(saves.length, 0);
  assert.match(document.querySelector('[role="alert"]').textContent, /1분 이상/);
  await set(minutes(), -1);
  assert.equal(document.querySelector('form').checkValidity(), false);
  await set(hours(), 0); await set(minutes(), 1.5);
  assert.equal(document.querySelector('form').checkValidity(), false);
  await set(minutes(), 1); await submit();
  assert.equal(saves.length, 1);
  assert.equal(saves[0][0].durationHours, 1 / 60);
});

test('closing/canceling writes nothing; reopening a new form resets hourly mode', async t => {
  const { saves, render } = await mount(t);
  await act(async () => button('시급 계산').click());
  await set(hours(), 0); await set(minutes(), 10);
  await render({ isOpen: false });
  assert.equal(document.querySelector('form'), null);
  assert.deepEqual(saves, []);
  await render({ isOpen: true });
  assert.equal(hours().value, '6'); assert.equal(minutes().value, '0');
  assert.match(document.body.textContent, /총 강의료 \(원\)/);
  assert.equal(fee().value, '1000000');
  assert.deepEqual(saves, []);
});
