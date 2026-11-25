import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { transpileModule } from 'typescript';
import { backendProxyBaseUrl } from '../shared/backend/proxy.ts';

async function handler(name, env = {}) {
  const source = await readFile(new URL(`../server/api/conversation/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = transpileModule(source, { compilerOptions: { module: 1, target: 9 } });
  const exports = {};
  const requests = [];
  vm.runInNewContext(outputText, {
    exports,
    require: id => id.includes('backend/proxy') ? { backendProxyBaseUrl } : { readSessionToken: event => event.token },
    process: { env },
    defineEventHandler: fn => fn,
    getQuery: event => event.query,
    useRuntimeConfig: () => ({ backendApiBaseUrl: 'https://configured.example/api/v1/' }),
    createError: data => Object.assign(new Error(data.message), data),
    fetch: async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify([
        { text: 'Second', order: 2, type: name === 'engage' ? 'engage' : 'constant', identifier: 'dialogue-1', audioFile: '/uploads/second.wav' },
        { text: 'First', order: 1, type: name === 'engage' ? 'engage' : 'constant', identifier: 'dialogue-1', audioFile: '/uploads/first.wav' },
        { text: 'Other dialogue', order: 1, type: name === 'engage' ? 'engage' : 'constant', identifier: 'dialogue-2' },
      ]), { status: 200 });
    },
  });
  return { run: exports.default, requests };
}

for (const name of ['engage', 'constant-audio']) {
  test(`${name} uses the build-time backend when runtime environment variables are absent`, async () => {
    const { run, requests } = await handler(name);
    const result = await run({ method: 'GET', query: { chapterId: 'chapter-1', identifier: 'dialogue-1' }, token: 'student-token' });
    const type = name === 'engage' ? 'engage' : 'constant';
    assert.equal(requests[0].url, `https://configured.example/api/v1/conversations/${type}/chapter-1`);
    assert.equal(requests[0].options.headers.Authorization, 'Bearer student-token');
    const texts = name === 'engage' ? Array.from(result.pieces) : Array.from(result.items, item => item.text);
    assert.deepEqual(texts, ['First', 'Second']);
  });

  test(`${name} honors the deployment backend override`, async () => {
    const { run, requests } = await handler(name, { NUXT_BACKEND_API_BASE_URL: 'https://runtime.example/v2', VITE_API_BASE_URL: 'https://environment.example/v1' });
    await run({ method: 'GET', query: { chapterId: 'chapter-1' } });
    assert.ok(requests[0].url.startsWith('https://runtime.example/v2/conversations/'));
  });

  test(`${name} reports a missing chapter as a request error`, async () => {
    const { run, requests } = await handler(name);
    await assert.rejects(run({ method: 'GET', query: {} }), error => error.statusCode === 400);
    assert.equal(requests.length, 0);
  });
}
