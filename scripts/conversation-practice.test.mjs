import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { compileScript, parse } from 'vue/compiler-sfc';
import { transpileModule } from 'typescript';
import * as vue from 'vue';

const filename = new URL('../app/pages/conversation-practice/index.vue', import.meta.url);
const { descriptor } = parse(await readFile(filename, 'utf8'));
const script = compileScript(descriptor, { id: 'conversation-practice-test' });
const { outputText } = transpileModule(script.content, { compilerOptions: { module: 1, target: 9 } });

function mount(t, fetcher = async () => ({ pieces: ['First?', 'Second?'], entries: [] })) {
  const mounted = [];
  const unmounted = [];
  const timers = new Map();
  const requests = [];
  const exports = {};
  const require = createRequire(import.meta.url);
  let recognition;
  class Recognition {
    starts = 0;
    stops = 0;
    aborts = 0;
    constructor() { recognition = this; }
    start() { this.starts++; }
    stop() { this.stops++; }
    abort() { this.aborts++; }
  }
  const window = { SpeechRecognition: Recognition, location: { search: '', origin: 'https://portal.example' }, addEventListener() {}, removeEventListener() {}, history: {} };
  const navigator = {};
  window.parent = window;
  const scope = vue.effectScope();
  vm.runInNewContext(outputText, {
    exports,
    require: name => name === 'vue' ? { ...vue, onMounted: fn => mounted.push(fn), onUnmounted: fn => unmounted.push(fn) }
      : name.endsWith('.vue') ? {} : require(name),
    definePageMeta() {},
    useRoute: () => ({ query: { chapterId: 'chapter-1' } }),
    useRouter: () => ({ push() {}, back() {} }),
    useCookie: () => vue.ref('student-token'),
    useRuntimeConfig: () => ({ app: { baseURL: '/portal/' } }),
    $fetch: async (url, options) => { requests.push({ url, options }); return fetcher(url, options); },
    window, document: { body: { style: { overflow: '' } } }, navigator,
    URL, URLSearchParams, console,
    setTimeout: fn => { const id = {}; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
    setInterval: fn => { const id = {}; timers.set(id, fn); return id; },
    clearInterval: id => timers.delete(id),
  });
  const state = scope.run(() => exports.default.setup({}, { expose() {} }));
  mounted.forEach(fn => fn());
  t.after(() => { unmounted.forEach(fn => fn()); scope.stop(); });
  return { state, recognition, timers, requests, navigator, unmount: () => unmounted.forEach(fn => fn()) };
}

test('speech errors release recording state and show feedback without throwing', t => {
  const { state, recognition } = mount(t);
  state.isRecording.value = true;
  assert.doesNotThrow(() => recognition.onerror({ error: 'not-allowed' }));
  assert.equal(state.isRecording.value, false);
  assert.equal(state.statusMessage.value.type, 'error');
});

test('restarting stops recognition and ignores an answer still being validated', async t => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const { state, recognition } = mount(t, url => url.endsWith('/validate') ? pending : Promise.resolve({ pieces: ['First?', 'Second?'], entries: [] }));
  state.conversationPieces.value = ['First?', 'Second?'];
  state.conversationStarted.value = true;
  state.isRecording.value = true;
  const validation = state.validateAnswer('My answer');
  state.resetConversation();
  finish({ success: true, isCorrect: true, feedback: 'Correct' });
  await validation;
  assert.ok(recognition.aborts + recognition.stops > 0);
  assert.equal(state.currentIndex.value, 0);
  assert.equal(state.conversationHistory.value.length, 0);
  assert.equal(state.conversationCompleteMessage.value, '');
});

test('a delayed audio-ended callback cannot start recording after restart', t => {
  const { state, recognition, timers } = mount(t);
  state.conversationStarted.value = true;
  state.conversationPieces.value = ['First?'];
  state.onAudioEnded();
  state.resetConversation();
  for (const callback of [...timers.values()]) callback();
  assert.equal(recognition.starts, 0);
});

test('conversation API calls use the configured portal base path', async t => {
  const { state, requests } = mount(t);
  await state.loadConversationPieces();
  assert.ok(requests.length > 0);
  assert.ok(requests.every(request => request.url.startsWith('/portal/api/conversation/')));
});

test('repeated submissions validate an answer only once', async t => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const { state, requests } = mount(t, url => url.endsWith('/validate') ? pending : Promise.resolve({ pieces: [], entries: [] }));
  state.conversationStarted.value = true;
  state.conversationPieces.value = ['First?', 'Second?'];
  state.inputMode.value = 'text';
  const first = state.validateAnswer('My answer');
  await state.validateAnswer('My answer');
  assert.equal(requests.filter(request => request.url.endsWith('/validate')).length, 1);
  finish({ success: true, isCorrect: true, feedback: 'Correct' });
  await first;
  assert.equal(state.currentIndex.value, 1);
  assert.equal(state.isProcessing.value, false);
});

test('closing the page ignores in-flight validation and later recognition results', async t => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const { state, recognition, unmount, requests } = mount(t, url => url.endsWith('/validate') ? pending : Promise.resolve({ pieces: [] }));
  state.conversationStarted.value = true;
  state.conversationPieces.value = ['First?', 'Second?'];
  const validation = state.validateAnswer('My answer');
  unmount();
  finish({ success: true, isCorrect: true });
  await validation;
  recognition.onresult({ results: [[{ transcript: 'Late result' }]] });
  assert.equal(state.currentIndex.value, 0);
  assert.equal(requests.filter(request => request.url.endsWith('/validate')).length, 1);
});

test('an expired session remains visible in the conversation preview', async t => {
  const { state } = mount(t, async () => { throw { statusCode: 401 }; });
  await state.fetchPreviewPieces();
  assert.match(state.previewError.value, /sign in again/i);
});

test('speech generated for a previous session cannot play after restart', async t => {
  let finish;
  let plays = 0;
  const pending = new Promise(resolve => { finish = resolve; });
  const { state, requests } = mount(t, url => url.endsWith('/tts') ? pending : Promise.resolve({ pieces: [], success: true }));
  state.conversationStarted.value = true;
  state.conversationPieces.value = ['First?'];
  state.audioRef.value = { pause() {}, play() { plays++; return Promise.resolve(); } };
  const playback = state.playCurrentPiece();
  for (let attempt = 0; attempt < 10 && !requests.some(request => request.url.endsWith('/tts')); attempt++) await Promise.resolve();
  assert.ok(requests.some(request => request.url.endsWith('/tts')));
  state.resetConversation();
  finish({ success: true, audioUrl: '/old-session.wav' });
  await playback;
  assert.equal(plays, 0);
  assert.equal(state.currentAudioUrl.value, null);
  assert.equal(state.isGeneratingTTS.value, false);
});

test('microphone permission resolving after restart releases the acquired stream', async t => {
  let grant;
  let stopped = 0;
  const { state, navigator } = mount(t);
  navigator.mediaDevices = { getUserMedia: () => new Promise(resolve => { grant = resolve; }) };
  state.isRecording.value = true;
  const request = state.startMicLevel();
  state.resetConversation();
  grant({ getTracks: () => [{ stop: () => stopped++ }] });
  await request;
  assert.equal(stopped, 1);
  assert.equal(state.audioLevel.value, 0);
});

test('chapter buttons open the correct embedded practice route at root and /portal/', async () => {
  const source = await readFile(new URL('../app/utilities/parsers/conversationParser.ts', import.meta.url), 'utf8');
  const { outputText } = transpileModule(source, { compilerOptions: { module: 1, target: 9 } });
  for (const base of ['/', '/portal/']) {
    const elements = [];
    const exports = {};
    const body = { style: {}, appendChild() {} };
    const document = {
      body,
      getElementById: id => elements.find(element => element.id === id),
      createElement: () => {
        const element = { style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} };
        elements.push(element);
        return element;
      },
    };
    const window = { location: { origin: 'https://portal.example' }, history: { state: null, pushState(state) { this.state = state; } }, addEventListener() {} };
    vm.runInNewContext(outputText, { exports, window, document, URLSearchParams });
    for (const type of ['engage', 'constant']) {
      const html = exports.default(`conversation="dialogue's & <1>",chapterId="chapter-1",type="${type}",language="sw"`, base);
      const action = html.match(/onclick="([^"]+)"/)[1]
        .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      vm.runInNewContext(action, { openConversationPractice: window.openConversationPractice });
      const iframe = document.getElementById('conversation-practice-iframe');
      const url = new URL(iframe.src, window.location.origin);
      assert.equal(url.pathname, `${base}${type === 'constant' ? 'english-practice' : 'conversation-practice'}`);
      assert.equal(url.searchParams.get('identifier'), "dialogue's & <1>");
      assert.equal(url.searchParams.get('embed'), '1');
      assert.equal(url.searchParams.get('language'), 'sw');
      assert.equal(iframe.allow, 'microphone; autoplay');
    }
  }
});
