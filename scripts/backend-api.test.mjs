import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiDocs } from '../app/utilities/apiDocs.ts';
import { loadMediaModule } from './media-test-helpers.mjs';

function backendApi(baseURL, requestFetch) {
  const { useBackendApi } = loadMediaModule('../app/composables/useBackendApi.ts', {
    useRuntimeConfig: () => ({
      app: { baseURL },
      backendApiBaseUrl: 'https://private-runtime-backend.example/api/v1',
    }),
    useRequestFetch: () => requestFetch,
  }, {
    '../utilities/apiDocs': { createApiDocs },
  });
  return useBackendApi();
}

test('topic reloads and browser navigation use the request-aware proxy at root and /portal/', async () => {
  for (const base of ['/', '/portal/']) {
    const requests = [];
    const topic = { chapters: [{ _id: 'chapter-id' }], languageData: [{ name: 'English' }] };
    // Nuxt provides its request-aware fetch on SSR and browser fetch on the client.
    for (const environment of ['server', 'browser']) {
      const requestFetch = async (url, options) => {
        requests.push({ url, options, environment });
        return topic;
      };
      const { api, fetch } = backendApi(base, requestFetch);
      assert.equal(fetch, requestFetch);
      const result = await fetch(api.topics.getTopicId.replaceAll(':id', 'topic-id'), {
        headers: { Authorization: 'Bearer learner-token' },
      });
      assert.equal(result, topic);
      assert.equal(requests.at(-1).url, `${base}api/backend/v1/topics/topic-id`);
      assert.equal(requests.at(-1).options.headers.Authorization, 'Bearer learner-token');
      assert.equal(api.chapters.getChapterId, `${base}api/backend/v1/chapters/:id`);
      assert.equal(api.chapters.getTopicChapterQNs, `${base}api/backend/v1/questions/topic-chapter`);
    }
    assert.equal(requests[0].url, requests[1].url);
  }
});

test('topic request failures retain their HTTP status for the page error and auth handling', async () => {
  for (const statusCode of [401, 403, 404, 502]) {
    const error = Object.assign(new Error('Backend request failed'), { statusCode });
    const { api, fetch } = backendApi('/portal/', async () => { throw error; });
    await assert.rejects(fetch(api.topics.getTopicId.replaceAll(':id', 'topic-id')), result => result === error);
  }
});

test('resource collections preserve subject filters through the portal proxy', async () => {
  const rows = [{ _id: 'video-1', subject: { name: 'Physics' } }];
  const requests = [];
  const { api, fetchList } = backendApi('/portal/', async (url, options) => {
    requests.push({ url, options });
    return rows;
  });
  assert.equal(await fetchList(api.videos.getPublicVideoBySubjectId.replace('{subjectId}', 'physics'), {
    params: { level: 'form-one', videoType: 'Conceptual' },
  }), rows);
  assert.equal(requests[0].url, '/portal/api/backend/v1/public-videos/by-subject/physics');
  assert.deepEqual(requests[0].options.params, { level: 'form-one', videoType: 'Conceptual' });
});

test('an invalid resource response fails instead of becoming an empty content list', async () => {
  for (const result of ['<html>Portal page</html>', { error: 'Wrong API endpoint' }, null]) {
    const { fetchList } = backendApi('/portal/', async () => result);
    await assert.rejects(fetchList('/portal/api/backend/v1/public-videos'), /invalid resource list/);
  }
  const { fetchList } = backendApi('/portal/', async () => []);
  assert.deepEqual(await fetchList('/portal/api/backend/v1/public-videos'), []);
});
