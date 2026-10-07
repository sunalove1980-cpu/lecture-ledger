import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { hasLumiSourceMarker, parseGEventsToLectures } from '../src/services/googleCalendar.ts';
import { appendCalendarLectures, CALENDAR_BACKUP_KEY } from '../src/services/storage.ts';

let dom;
before(() => {
  // Synthetic, detached HTML only. No resource loader or script execution enabled.
  dom = new JSDOM('');
  globalThis.document = dom.window.document;
});
after(() => { delete globalThis.document; delete globalThis.localStorage; dom.window.close(); });
const actualDescription = '<p>강의 주제: 청소년 참여 촉진 퍼실리테이션\n내용: 청소년들의 참여를 자연스럽게 이끌어내는 질문법과 참여 촉진 기법 등 실제 프로젝트 수업에서 바로 활용할 수 있는 퍼실리테이션 기법\n강사비: 1회 23만원 (2시간 기준)\n담당: 정은정 팀장\n등록: 루미</p>';
const events = ['c0m1nraoqvefkp3o2aj28bgrv4', '3eqtlrm67900ujnh9vdqbk9od8'].map((id, index) => ({
  id, status: 'confirmed', created: '2026-10-07T00:00:00+09:00', description: actualDescription,
  summary: '[G] 오후 3시 30분~5시 30분, 퍼실리테이션, 울산 북구 청소년 진로직업센터, 23만원',
  start: { dateTime: `2026-10-${index === 0 ? '23' : '30'}T15:30:00+09:00` },
  end: { dateTime: `2026-10-${index === 0 ? '23' : '30'}T17:30:00+09:00` },
}));

test('supplied HTML fails former raw-line check, passes exact visible-line check', () => {
  assert.equal(actualDescription.split(/\r?\n/).some(line => line.trim() === '등록: 루미'), false);
  assert.equal(hasLumiSourceMarker(actualDescription), true);
  assert.deepEqual(parseGEventsToLectures(events).map(({ date, startTime, endTime, totalFee }) => ({ date, startTime, endTime, totalFee })), [
    { date: '2026-10-23', startTime: '15:30', endTime: '17:30', totalFee: 230000 },
    { date: '2026-10-30', startTime: '15:30', endTime: '17:30', totalFee: 230000 },
  ]);
});

for (const description of [
  '등록: 루미', '메모\r\n등록: 루미\r\n', '<p>등록: 루미</p>',
  '<div>메모</div><div>등록: 루미</div>', '메모<br>등록: 루미<br/>',
  '<p><strong>등록:</strong> 루미</p>', '<p>등록:&nbsp;루미</p>',
  '<div>등록&#58; &#47336;&#48120;</div>', '메모 &amp; 내용\n등록: 루미',
]) test(`accept exact marker line: ${description}`, () => assert.equal(hasLumiSourceMarker(description), true));

for (const description of [
  '', '<p>일반 강의</p>', '<p>담당: 팀장 등록: 루미</p>', '<p>등록: 루미 아님</p>',
  '<p>미등록: 루미</p>', '<p>등록: 루미나</p>', '<p>등록:루미</p>',
  '<p data-source="등록: 루미">메모</p>', '<!-- 등록: 루미 -->',
  '<script>등록: 루미</script>', '<style>등록: 루미</style>', '<template>등록: 루미</template>',
  '&lt;p&gt;등록: 루미&lt;/p&gt;', '<p>등록: 루미 &amp; 다른 사람</p>',
]) test(`reject absent or inexact marker: ${description}`, () => assert.equal(hasLumiSourceMarker(description), false));

test('HTML import preserves old records and backup, excludes 190 unrelated events and remains idempotent', () => {
  const key = 'lecture_fee_manager_lectures_v1';
  const legacy = [{ id: 'old', totalFee: 987654, isPaid: true, paidDate: '2026-09-01', notes: '원래 메모', unknown: { keep: true } }];
  const original = JSON.stringify(legacy, null, 2);
  const store = new Map([[key, original]]);
  const writes = [];
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => { writes.push(key); store.set(key, value); } };
  const unrelated = Array.from({ length: 190 }, (_, i) => ({ ...events[0], id: `unrelated-${i}`, description: `<p>다른 강의 ${i}</p>` }));
  const candidates = parseGEventsToLectures([...unrelated, ...events]);
  assert.equal(candidates.length, 2);
  const first = appendCalendarLectures(candidates);
  assert.equal(first.addedCount, 2);
  assert.deepEqual(first.lectures[0], legacy[0]);
  assert.equal(JSON.parse(store.get(CALENDAR_BACKUP_KEY)).original, original);
  const after = store.get(key);
  const second = appendCalendarLectures(candidates);
  assert.equal(second.addedCount, 0); assert.equal(second.duplicateCount, 2);
  assert.equal(store.get(key), after);
  assert.deepEqual(writes, [CALENDAR_BACKUP_KEY, key]);
});

test('HTML marker does not bypass creation cutoff, missing created, cancellation or start cutoff', () => {
  const variants = [
    { created: '2026-10-06T14:59:59.999Z' }, { created: undefined },
    { status: 'cancelled' }, { start: { dateTime: '2026-10-01T15:30:00+09:00' } },
  ].map(changes => ({ ...events[0], ...changes }));
  assert.deepEqual(parseGEventsToLectures(variants), []);
  assert.equal(parseGEventsToLectures([{ ...events[0], created: '2026-10-06T15:00:00.000Z' }]).length, 1);
});

test('HTML remains detached and never executes scripts or installs resource elements', () => {
  const before = document.documentElement.outerHTML;
  assert.equal(hasLumiSourceMarker('<img src="https://example.invalid/image"><script>globalThis.executed = true</script><p>등록: 루미</p>'), true);
  assert.equal(globalThis.executed, undefined);
  assert.equal(document.documentElement.outerHTML, before);
});
