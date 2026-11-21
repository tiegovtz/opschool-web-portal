import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiDocs } from '../app/utilities/apiDocs.ts';

test('direct topic loads tolerate trailing slashes in the upstream API root', () => {
  const topicId = '67d6a82553661731a20dc48e';
  for (const suffix of ['', '/', '///']) {
    const api = createApiDocs(`http://backend.example/api/v1${suffix}`);
    assert.equal(
      api.topics.getTopicId.replace(':id', topicId),
      `http://backend.example/api/v1/topics/${topicId}`,
    );
    assert.equal(api.chapters.getChapterId, 'http://backend.example/api/v1/chapters/:id');
    assert.equal(api.requestBaseURL, 'http://backend.example/api/v1');
  }
});

test('normalizing browser API URLs preserves the separately configured media origin', () => {
  const mediaBase = 'https://media.example/uploads/';
  const api = createApiDocs(' /api/backend/v1/ ', mediaBase);
  assert.equal(api.topics.getTopicId, '/api/backend/v1/topics/:id');
  assert.equal(api.auth.updateTimeSpent, '/api/backend/v1/auth/update-time-spent');
  assert.equal(api.baseURL, mediaBase);
});
