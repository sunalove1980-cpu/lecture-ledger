import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGEventsToLectures } from '../src/services/googleCalendar.ts';
import { appendCalendarLectures, CALENDAR_BACKUP_KEY } from '../src/services/storage.ts';
import { syncLumiCalendar, formatSyncSummary } from '../src/services/calendarSync.ts';
const key = 'lecture_fee_manager_lectures_v1';
const prior = [{id:'manual', date:'2026-09-01', title:'기존', agency:'기관', totalFee:777777, isPaid:true, paidDate:'2026-09-20', notes:'소중한 메모', emotion:'기쁨', extra:{legacy:true}, updatedAt:'unchanged'}];
const original = JSON.stringify(prior, null, 2);
let data, writes, failKey;
const make = (id, day='23', overrides={}) => ({id, created:'2026-10-07T00:00:00+09:00', status:'confirmed', summary:'[G] 오후 3시 30분~5시 30분, 퍼실리테이션, 울산 북구 청소년 진로직업센터, 23만원', description:'등록: 루미', start:{dateTime:`2026-10-${day}T15:30:00+09:00`}, end:{dateTime:`2026-10-${day}T17:30:00+09:00`}, ...overrides});
const two = [make('c0m1nraoqvefkp3o2aj28bgrv4'), make('3eqtlrm67900ujnh9vdqbk9od8','30')];
beforeEach(() => {
 data = new Map([[key, original]]); writes=[]; failKey=null;
 globalThis.localStorage = {getItem:k=>data.get(k)??null, setItem:(k,v)=>{if(k===failKey)throw new Error('quota'); writes.push(k); data.set(k,v);}};
 Object.defineProperty(navigator,'locks',{configurable:true,value:{request:async (_name,fn)=>fn()}});
 globalThis.fetch = async () => ({ok:true,json:async()=>({items:two})});
});
test('two events append once; all legacy fields and original backup survive', async () => {
 const first=await syncLumiCalendar('synthetic','primary');
 assert.equal(first.addedCount,2); assert.deepEqual(first.lectures.slice(0,1),prior);
 assert.equal(first.lectures[1].startTime,'15:30'); assert.equal(first.lectures[1].endTime,'17:30'); assert.equal(first.lectures[1].totalFee,230000);
 assert.equal(JSON.parse(data.get(CALENDAR_BACKUP_KEY)).original,original);
 assert.deepEqual(writes,[CALENDAR_BACKUP_KEY,key]);
 const after=data.get(key), backup=data.get(CALENDAR_BACKUP_KEY);
 const second=await syncLumiCalendar('synthetic','primary');
 assert.equal(second.addedCount,0); assert.equal(second.duplicateCount,2); assert.equal(data.get(key),after); assert.equal(data.get(CALENDAR_BACKUP_KEY),backup);
 assert.equal(formatSyncSummary(second),'동기화 완료! 신규 0건 추가, 중복 2건 건너뜀, 대상 외 0건 제외. 기존 기록은 변경하지 않았습니다.');
});
test('marker, creation cutoff, cancellation and schedule filters',()=>{
 const excluded=[make('no-marker','23',{description:''}),make('old','23',{created:'2026-10-06T23:59:59+09:00'}),make('missing-created','23',{created:undefined}),make('invalid-created','23',{created:'bad'}),make('cancelled','23',{status:'cancelled'}),make('fake-marker','23',{description:'등록: 루미 아님'}),make('no-prefix','23',{summary:'퍼실리테이션'}),make('old-date','01')];
 assert.deepEqual(parseGEventsToLectures(excluded),[]); assert.equal(writes.length,0);
});
test('same event ID skips even changed fields; manual identity skips without linking',()=>{
 const c=parseGEventsToLectures(two);
 const existing=[{...prior[0],googleCalendarEventId:c[0].googleCalendarEventId},{...c[1],id:'manual2',googleCalendarEventId:undefined,isPaid:true,notes:'keep',totalFee:900000}];
 data.set(key,JSON.stringify(existing)); const before=data.get(key);
 const result=appendCalendarLectures(c); assert.equal(result.duplicateCount,2); assert.equal(data.get(key),before); assert.deepEqual(result.lectures,JSON.parse(before)); assert.equal(writes.length,0);
});
test('same time with different content is a distinct lecture; batch duplicates skip',()=>{
 const c=parseGEventsToLectures(two); data.set(key,JSON.stringify([{...c[0],id:'manual',googleCalendarEventId:undefined,title:'다른 강의'}]));
 const r=appendCalendarLectures([c[0],c[0]]); assert.equal(r.addedCount,1); assert.equal(r.duplicateCount,1);
});
for (const bad of ['-23만원','23만원추가','미정','', '999999999999999999999원', '230,000원']) test(`invalid fee ${bad} aborts whole batch`,async()=>{
 globalThis.fetch=async()=>({ok:true,json:async()=>({items:[two[0],make('bad','30',{summary:`[G] 15시~17시, 제목, 기관, ${bad}`})]})});
 await assert.rejects(syncLumiCalendar('synthetic','primary')); assert.equal(data.get(key),original); assert.equal(writes.length,0);
});
for (const mode of ['network','json','shape','second-page']) test(`${mode} failure preserves original`,async()=>{
 let count=0; globalThis.fetch=async()=>{count++; if(mode==='network'||(mode==='second-page'&&count===2))throw new Error('network');return {ok:true,json:async()=>{if(mode==='json')throw new Error('json');return mode==='shape'?{items:{}}:{items:two,nextPageToken:'next'};}}};
 await assert.rejects(syncLumiCalendar('synthetic','primary')); assert.equal(data.get(key),original); assert.equal(writes.length,0);
});
for (const raw of ['broken','{}','[null]']) test(`corrupt storage ${raw} is not overwritten`,async()=>{
 data.set(key,raw);await assert.rejects(syncLumiCalendar('synthetic','primary'));assert.equal(data.get(key),raw);assert.equal(writes.length,0);
});
for (const blocked of [CALENDAR_BACKUP_KEY,key]) test(`storage failure at ${blocked} preserves original`,async()=>{
 failKey=blocked;await assert.rejects(syncLumiCalendar('synthetic','primary'));assert.equal(data.get(key),original);
});
test('UTC timestamps use Korea time regardless of host timezone',()=>{
 const [c]=parseGEventsToLectures([make('utc','23',{summary:'[G] 퍼실리테이션, 기관, 23만원',start:{dateTime:'2026-10-22T23:30:00Z'},end:{dateTime:'2026-10-23T01:30:00Z'}})]);
 assert.equal(c.date,'2026-10-23');assert.equal(c.startTime,'08:30');assert.equal(c.endTime,'10:30');
});
test('UI routes through single safe import, explains source and preservation',()=>{
 const ui=readFileSync(new URL('../src/components/GoogleSyncModal.tsx',import.meta.url),'utf8');
 assert.match(ui,/syncLumiCalendar\(accessToken/);assert.match(ui,/formatSyncSummary\(result\)/);assert.match(ui,/등록: 루미/);assert.doesNotMatch(ui,/saveLecture|getLectures|updatedCount/);
});
test('no eligible events is a byte-for-byte no-op',async()=>{
 globalThis.fetch=async()=>({ok:true,json:async()=>({items:[make('old','23',{created:'2026-10-01T00:00:00+09:00'})]})});
 const r=await syncLumiCalendar('synthetic','primary');assert.equal(r.excludedCount,1);assert.equal(data.get(key),original);assert.equal(writes.length,0);
});
test('missing safe locking support fails before any write',async()=>{
 Object.defineProperty(navigator,'locks',{configurable:true,value:undefined});await assert.rejects(syncLumiCalendar('synthetic','primary'));assert.equal(data.get(key),original);assert.equal(writes.length,0);
});
test('changed ledger detected before final write',()=>{
 const concurrent=JSON.stringify([...prior,{id:'other-tab',notes:'preserve'}]);
 const write=localStorage.setItem;localStorage.setItem=(k,v)=>{write(k,v);if(k===CALENDAR_BACKUP_KEY)data.set(key,concurrent);};
 assert.throws(()=>appendCalendarLectures(parseGEventsToLectures(two)));assert.equal(data.get(key),concurrent);
});
test('new browser creates ledger with explicit absent-original backup',async()=>{
 data.delete(key); const r=await syncLumiCalendar('synthetic','primary');assert.equal(r.addedCount,2);assert.equal(JSON.parse(data.get(CALENDAR_BACKUP_KEY)).original,null);
});
test('malformed eligible event aborts without partially importing valid event',async()=>{
 globalThis.fetch=async()=>({ok:true,json:async()=>({items:[two[0],make('bad','30',{end:{dateTime:'invalid'}})]})});
 await assert.rejects(syncLumiCalendar('synthetic','primary'));assert.equal(data.get(key),original);assert.equal(writes.length,0);
});
