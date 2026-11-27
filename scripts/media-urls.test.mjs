import assert from 'node:assert/strict';
import test from 'node:test';
import { loadMediaModule } from './media-test-helpers.mjs';

const urls = loadMediaModule('../app/utilities/mediaUrls.ts');
const options = { appBaseURL: '/portal/', uploadsBaseURL: 'https://current.example/api' };

test('experiment entry pages resolve for relative production uploads and folders without trailing slashes', async () => {
  const requests = [];
  const { resolveExperimentEntryUrl } = loadMediaModule('../app/utilities/resolveUploadUrl.ts', {
    fetch: async (url, init) => { requests.push({ url, method: init.method }); return { ok: true }; },
  });
  for (const source of [
    '/api/uploads/steps/id/Activity2.1/',
    '/api/uploads/steps/id/Activity2.1',
    '/portal/api/uploads/steps/id/Activity2.1/',
    '/portal/api/uploads/steps/id/Activity2.1',
    'https://opschool.tie.go.tz/api/uploads/steps/id/Activity2.1/',
    'https://opschool.tie.go.tz/api/uploads/steps/id/Activity2.1',
    '//opschool.tie.go.tz/api/uploads/steps/id/Activity2.1/',
  ]) {
    const expected = `${source.replace(/\/$/, '')}/index.html`;
    assert.equal(await resolveExperimentEntryUrl(source), expected, source);
    assert.deepEqual(requests.at(-1), { url: expected, method: 'HEAD' });
  }
});

test('the experiment page resolves stepsFileUrl after applying the live /api uploads configuration', async () => {
  const requests = [];
  const globals = { fetch: async url => { requests.push(url); return { ok: true }; } };
  const media = loadMediaModule('../app/utilities/mediaUrls.ts', globals);
  const { resolveExperimentEntryUrl } = loadMediaModule('../app/utilities/resolveUploadUrl.ts', globals);
  const stepsFileUrl = 'https://opschool.tie.go.tz:5001/uploads/steps/example/Activity1.1/';
  // The live page calls resolveExperimentEntryUrl(mediaUrls.asset(stepsFileUrl)).
  const asset = media.resolveContentAssetUrl(stepsFileUrl, { appBaseURL: '/portal/', uploadsBaseURL: '/api' });
  assert.equal(asset, '/api/uploads/steps/example/Activity1.1/');
  assert.equal(await resolveExperimentEntryUrl(asset), '/api/uploads/steps/example/Activity1.1/index.html');
  assert.deepEqual(requests, ['/api/uploads/steps/example/Activity1.1/index.html']);
});

test('experiment entry probing preserves queries and hashes and supports find.html packages', async () => {
  const requests = [];
  const { resolveExperimentEntryUrl } = loadMediaModule('../app/utilities/resolveUploadUrl.ts', {
    fetch: async url => { requests.push(url); return { ok: url.includes('/find.html') }; },
  });
  assert.equal(await resolveExperimentEntryUrl('/api/uploads/steps/id/Activity2.1?lang=sw#start'),
    '/api/uploads/steps/id/Activity2.1/find.html?lang=sw#start');
  assert.deepEqual(requests, [
    '/api/uploads/steps/id/Activity2.1/index.html?lang=sw#start',
    '/api/uploads/steps/id/Activity2.1/find.html?lang=sw#start',
  ]);
});

test('experiment entry resolution still appends index.html when HEAD probes fail', async () => {
  for (const fetch of [async () => { throw new TypeError('CORS blocked'); }, async () => ({ ok: false })]) {
    const { resolveExperimentEntryUrl } = loadMediaModule('../app/utilities/resolveUploadUrl.ts', { fetch });
    assert.equal(await resolveExperimentEntryUrl('uploads/steps/id/Activity2.1/', '/api'),
      '/api/uploads/steps/id/Activity2.1/index.html');
  }
  const { resolveExperimentEntryUrl } = loadMediaModule('../app/utilities/resolveUploadUrl.ts');
  assert.equal(await resolveExperimentEntryUrl('/portal/api/uploads/steps/id/Activity2.1/'),
    '/portal/api/uploads/steps/id/Activity2.1/index.html');
});

test('experiment resolution preserves explicit files and ignores empty or inline sources', async () => {
  const { resolveExperimentEntryUrl } = loadMediaModule('../app/utilities/resolveUploadUrl.ts', {
    fetch: () => { assert.fail('An explicit file must not be probed'); },
  });
  for (const source of ['', '#start', 'blob:package', 'data:text/html,example',
    '/api/uploads/experiment/index.html?lang=sw#start',
    '/api/uploads/experiment/find.html', 'https://cdn.example/experiment/lesson.HTML',
    '/api/uploads/experiment/package.zip']) {
    assert.equal(await resolveExperimentEntryUrl(source), source);
  }
});

test('upload references share one public root without duplicating /api or /v1', () => {
  for (const source of [
    'uploads/subjects/cover.webp', '/uploads/subjects/cover.webp', '/api/uploads/subjects/cover.webp', '/api/v1/uploads/subjects/cover.webp',
    'http://127.0.0.1/api/uploads/subjects/cover.webp', 'http://gateway/api/uploads/subjects/cover.webp',
    'https://opschool.tie.go.tz:5001/uploads/subjects/cover.webp', 'https://apitie.ekima.africa/v1/uploads/subjects/cover.webp',
    'https://current.example/api/uploads/subjects/cover.webp',
  ]) assert.equal(urls.resolveContentAssetUrl(source, options), 'https://current.example/api/uploads/subjects/cover.webp', source);
  assert.equal(urls.resolveContentAssetUrl('/api/uploads/file.png?a=1#figure', options), 'https://current.example/api/uploads/file.png?a=1#figure');
  assert.equal(urls.resolveContentAssetUrl('/uploads/file.png', { uploadsBaseURL: '/api/v1' }), '/api/uploads/file.png');
});

test('external assets, inline audio and local app assets retain their correct destinations', () => {
  for (const source of ['https://cdn.example/uploads/file.mp4?signature=abc', '//cdn.example/image.webp', 'blob:audio-test', 'data:image/png;base64,AA', '#figure']) {
    assert.equal(urls.resolveContentAssetUrl(source, options), source);
  }
  assert.equal(urls.resolveContentAssetUrl('/public/images/default.webp', options), '/portal/images/default.webp');
  assert.equal(urls.resolveContentAssetUrl('/temp-audio/conversation.wav', options), '/portal/temp-audio/conversation.wav');
  assert.equal(urls.resolveContentAssetUrl('/portal/images/default.webp', options), '/portal/images/default.webp');
  assert.equal(urls.resolveContentAssetUrl('javascript:alert(1)', options), '');
});

test('IDs and stored stream URLs become the current portal stream endpoint', () => {
  for (const kind of ['video', 'audio']) {
    for (const source of ['abc123', `/api/${kind}/abc123`, `/portal/api/${kind}/abc123?old=1`, `https://old.example/v1/${kind}-stream/abc123`]) {
      assert.equal(urls.resolveStreamUrl(source, kind, options), `/portal/api/${kind}/abc123`);
    }
    assert.equal(urls.resolveStreamUrl('https://cdn.example/lesson.mp4?signature=1', kind, options), 'https://cdn.example/lesson.mp4?signature=1');
  }
});

test('interactive players extract direct and nested sources without treating a full URL as an ID', () => {
  assert.equal(urls.mediaSourceFromHtml("<video src='/api/video/abc123'></video>", 'video'), '/api/video/abc123');
  assert.equal(urls.mediaSourceFromHtml('<video><source type="video/mp4" src="https://cdn.example/file.mp4?a=1&amp;b=2"></video>', 'video'), 'https://cdn.example/file.mp4?a=1&b=2');
  assert.equal(urls.mediaSourceFromHtml('<p>No video</p>', 'video'), '');
});

const parserImports = {
  '../apiDocs': { default: { baseURL: '/api/v1' } },
  '../controlls': { activityPopupId: {}, experimrntUrl: {} },
};
const parsers = loadMediaModule('../app/utilities/parsers/mediaParser.ts', {}, parserImports);

test('chapter videos accept IDs, full stream URLs, direct files, single quotes and direct src', () => {
  for (const markup of [
    '<video><source src="abc123"></video>',
    '<video><source type="video/mp4" src="https://old.example/v1/video-stream/abc123" /></video>',
    "<video src='/api/video/abc123' preload='auto'></video>",
  ]) {
    const html = parsers.videoParser(markup, options);
    assert.match(html, /src="\/portal\/api\/video\/abc123"/);
    assert.match(html, /preload="none"/);
    assert.ok(!html.includes('/api/video/https:'));
    assert.match(html, /href="\/portal\/interactive-video\?videoId=abc123"/);
  }
  const html = parsers.videoParser('<video poster="/uploads/poster.png"><source src="https://cdn.example/movie.webm?a=1&amp;b=2" type="video/webm"></video>', options);
  assert.match(html, /src="https:\/\/cdn.example\/movie.webm\?a=1&amp;b=2"/);
  assert.match(html, /type="video\/webm"/);
  assert.match(html, /poster="https:\/\/current.example\/api\/uploads\/poster.png"/);
});

test('experiment packages and 3D model posters resolve through the same asset rules', () => {
  const experiment = loadMediaModule('../app/utilities/parsers/experimentParser.ts', {}, parserImports).default;
  const model = loadMediaModule('../app/utilities/parsers/modelParser.ts', {}, parserImports).default;
  const html = experiment('expPackage="http://127.0.0.1/api/uploads/experiment/index.html",&lt;img src="uploads/experiment/cover.png" alt="Experiment"&gt;', options);
  assert.match(html, /src="https:\/\/current.example\/api\/uploads\/experiment\/index.html"/);
  assert.ok(!html.includes('127.0.0.1'));
  const modelHtml = model('model="uploads/model.glb",&lt;img src="/api/uploads/poster.png" alt="Model"&gt;', options);
  assert.match(modelHtml, /src="https:\/\/current.example\/api\/uploads\/model.glb"/);
  assert.match(modelHtml, /poster="https:\/\/current.example\/api\/uploads\/poster.png"/);
});
