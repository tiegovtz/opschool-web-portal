import assert from 'node:assert/strict';
import test from 'node:test';
import { adtLevelHub, adtClassOptions, adtSubjectOptions, scopeAdtCatalogue, filterAdtBooks, emptyAdtFilters, sortAdtOptions } from '../shared/adt/catalogue.ts';
import { adtPreviewCatalogue } from '../server/utils/adtPreview.ts';
import { adtBookSchema, adtRequestOptions, isPublishedAdtBook, toLearnerAdtBook } from '../server/utils/adtStore.ts';

test('accepts Store origins and API base URLs without duplicating the API prefix', () => {
  const previous = globalThis.useRuntimeConfig;
  try {
    for (const base of ['http://localhost:3001', 'http://localhost:3001/', 'http://localhost:3001/api/v1', 'http://localhost:3001/api/v1/']) {
      globalThis.useRuntimeConfig = () => ({ adtStoreBaseUrl: base, adtStoreApiKey: 'test-only' });
      assert.equal(adtRequestOptions('/api/v1/books').url, 'http://localhost:3001/api/v1/books');
    }
  } finally {
    if (previous) globalThis.useRuntimeConfig = previous;
    else delete globalThis.useRuntimeConfig;
  }
});

test('maps the managed education names and fails closed on unknown levels', () => {
  assert.equal(adtLevelHub('Pre-primary'), 'primary');
  assert.equal(adtLevelHub('Ordinary Secondary'), 'secondary');
  assert.equal(adtLevelHub('Advanced Secondary'), 'secondary');
  assert.equal(adtLevelHub('Unclassified'), null);
});
test('scopes books and filter options to their education hub', () => {
  const result = scopeAdtCatalogue(adtPreviewCatalogue, 'primary');
  assert.equal(result.books.length, 4);
  assert.deepEqual(result.classes.map(item => item.id).sort(), ['p0', 'p3', 'p4']);
  assert.ok(result.subjects.every(item => item.id !== 'english'));
});
test('uses relationships for level > class > subject', () => {
  assert.deepEqual(adtClassOptions(adtPreviewCatalogue, 'ordinary').map(item => item.id), ['f1', 'f2']);
  assert.deepEqual(adtSubjectOptions(adtPreviewCatalogue, 'ordinary', 'f2').map(item => item.id), ['math']);
  assert.deepEqual(adtSubjectOptions(adtPreviewCatalogue, 'primary', 'f2'), []);
  assert.deepEqual(adtClassOptions(adtPreviewCatalogue), adtPreviewCatalogue.classes);
});
test('tab-scoped classes and subjects work without an education-level filter', () => {
  const secondary = scopeAdtCatalogue(adtPreviewCatalogue, 'secondary');
  assert.deepEqual(adtClassOptions(secondary), secondary.classes);
  assert.ok(adtClassOptions(secondary).some(item => item.id === 'f1'));
  assert.deepEqual(adtSubjectOptions(secondary, '', 'f2').map(item => item.id), ['math']);
  assert.deepEqual(adtSubjectOptions(secondary, '', 'p3'), []);
  assert.deepEqual(adtSubjectOptions(secondary, '', ''), []);
  const filters = { ...emptyAdtFilters(), class: 'f2', subject: 'math' };
  assert.deepEqual(filterAdtBooks(secondary, filters).map(book => book.id), ['s-math']);
});
test('combines search with all classification filters', () => {
  const filters = { ...emptyAdtFilters(), level: 'ordinary', class: 'f2', subject: 'math', language: 'en', curriculum: '2023', search: 'MATHEMATICS form 2' };
  assert.deepEqual(filterAdtBooks(adtPreviewCatalogue, filters).map(book => book.id), ['s-math']);
  assert.equal(filterAdtBooks(adtPreviewCatalogue, { ...filters, language: 'sw' }).length, 0);
  assert.equal(filterAdtBooks(adtPreviewCatalogue, { ...filters, search: 'not a book' }).length, 0);
  assert.equal(filterAdtBooks(adtPreviewCatalogue, emptyAdtFilters()).length, 8);
});
test('matches multi-assigned books by IDs, including ISBN search', () => {
  const book = { ...adtPreviewCatalogue.books[0], levelIds: ['primary', 'ordinary'], isbn: '9781234567890' };
  const catalogue = { ...adtPreviewCatalogue, books: [book] };
  assert.equal(scopeAdtCatalogue(catalogue, 'secondary').books.length, 1);
  assert.equal(filterAdtBooks(catalogue, { ...emptyAdtFilters(), search: '978123' }).length, 1);
});
test('sorts class numbers naturally', () => {
  assert.deepEqual(sortAdtOptions([{ id: '10', name: 'Form 10' }, { id: '2', name: 'Form 2' }]).map(item => item.id), ['2', '10']);
});
test('website books without format fields are accepted; only ready, final-approved books are visible', () => {
  const book = adtBookSchema.parse({ ...adtPreviewCatalogue.books[0], status: 'Ready', approvalStatusValue: 'final_approved', coverThumbnail: null });
  assert.equal(isPublishedAdtBook(book), true);
  for (const patch of [{ status: 'Failed' }, { status: 'Review' }, { approvalStatusValue: 'draft' }, { approvalStatusValue: 'rejected' }]) {
    assert.equal(isPublishedAdtBook({ ...book, ...patch }), false);
  }
});
test('strips staff metadata and ignores untrusted cover URLs', () => {
  const book = adtBookSchema.parse({ ...adtPreviewCatalogue.books[0], status: 'Ready', approvalStatusValue: 'final_approved', formatValue: 'adt', currentApprovalTarget: 'Staff only', checksum: 'private', coverThumbnail: { url: 'https://untrusted.example/cover', mimeType: 'image/png' } });
  const learner = toLearnerAdtBook(book);
  assert.equal(learner.coverUrl, `/api/adt/books/${book.id}/cover`);
  assert.ok(!('currentApprovalTarget' in learner));
  assert.ok(!('checksum' in learner));
  assert.ok(!JSON.stringify(learner).includes('untrusted.example'));
});
