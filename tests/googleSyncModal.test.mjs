import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let server, GoogleSyncModal, App, Header;
before(async () => {
  // This is a synthetic client ID. No script, token or network request is allowed.
  server = await createServer({
    server: { middlewareMode: true }, appType: 'custom',
    define: { 'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify('test-only-client') },
  });
  ({ GoogleSyncModal } = await server.ssrLoadModule('/src/components/GoogleSyncModal.tsx'));
  ({ App } = await server.ssrLoadModule('/src/App.tsx'));
  ({ Header } = await server.ssrLoadModule('/src/components/Header.tsx'));
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});
after(async () => { await server?.close(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

for (const isConnected of [true, false]) {
  test(`${isConnected ? 'connected' : 'unconnected'} modal opens, closes and reopens without auth, fetch or storage writes`, async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test' });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    const activity = { authInit: 0, authRequest: 0, fetch: 0, storage: 0, config: 0, sync: 0, close: 0 };
    const prompts = [];
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => { activity.storage++; },
      removeItem: () => { activity.storage++; },
      clear: () => { activity.storage++; },
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { activity.fetch++; throw new Error('Unexpected network request'); };
    window.google = { accounts: { oauth2: { initTokenClient: () => {
      activity.authInit++;
      return { requestAccessToken: ({ prompt }) => { activity.authRequest++; prompts.push(prompt); } };
    } } } };
    const root = createRoot(document.getElementById('root'));
    let open = false;
    const render = () => root.render(React.createElement(React.StrictMode, null, React.createElement(GoogleSyncModal, {
      isOpen: open,
      onClose: () => { activity.close++; open = false; render(); },
      config: { calendarId: 'primary', isConnected, autoSync: true },
      onSaveConfig: () => { activity.config++; },
      onSyncComplete: () => { activity.sync++; },
    })));
    try {
      await act(async () => { render(); });
      assert.equal(document.querySelector('button'), null);
      await act(async () => { open = true; render(); });
      assert.match(document.body.textContent, /등록: 루미/);
      assert.match(document.body.textContent, /2026.10.07/);
      assert.match(document.body.textContent, /아래 버튼을 눌렀을 때만/);
      await act(async () => { document.querySelector('[aria-label="구글 캘린더 연동 창 닫기"]').click(); });
      assert.equal(document.querySelector('button'), null);
      await act(async () => { open = true; render(); });
      assert.deepEqual(activity, { authInit: 0, authRequest: 0, fetch: 0, storage: 0, config: 0, sync: 0, close: 1 });
      assert.equal(document.querySelector('script'), null);
      const label = isConnected ? '새 일정 가져오기' : '구글 계정 연결 후 새 일정 가져오기';
      const importButton = [...document.querySelectorAll('button')].find(button => button.textContent === label);
      assert.ok(importButton);
      assert.equal(importButton.disabled, false);
      // Only an explicit click reaches the fake OAuth client, never the real service.
      await act(async () => { importButton.click(); });
      assert.equal(activity.authInit, 1);
      assert.equal(activity.authRequest, 1);
      assert.deepEqual(prompts, [isConnected ? '' : 'consent']);
      assert.equal(activity.fetch, 0);
      assert.equal(activity.storage, 0);
      assert.equal(activity.config, 0);
      assert.equal(activity.sync, 0);
      assert.equal(importButton.disabled, true);
    } finally {
      await act(async () => root.unmount());
      globalThis.fetch = originalFetch;
      dom.window.close();
      delete globalThis.window;
      delete globalThis.document;
      delete globalThis.localStorage;
    }
  });
}

test('home renders visible preservation notice and policy version without Google connection', () => {
  globalThis.localStorage = { getItem: () => null };
  try {
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, /새 일정만 추가 · 기존 기록 보존/);
    assert.match(html, /동기화 기준 <!-- -->2026.10.07|동기화 기준 2026.10.07/);
  } finally { delete globalThis.localStorage; }
});

test('connected header names the action as opening guidance', () => {
  const html = renderToStaticMarkup(React.createElement(Header, {
    currentMonth: new Date('2026-10-07T00:00:00Z'), isGoogleConnected: true,
    onMonthChange() {}, onOpenNewLectureModal() {}, onOpenGoogleSyncModal() {}, onExportCsv() {}, onResetData() {},
  }));
  assert.match(html, /title="동기화 안내 열기"/);
  assert.match(html, />동기화<\/span>/);
});
