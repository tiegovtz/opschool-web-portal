<script setup lang="ts">
import type { AdtHub, AdtReaderBook } from '~~/shared/adt/catalogue';

definePageMeta({ path: '/:educationLevel(primary|secondary)/adt/:bookId', key: route => route.fullPath });
const route = useRoute();
const hub = computed<AdtHub>(() => route.params.educationLevel === 'primary' ? 'primary' : 'secondary');
const language = useHubPageLanguage();
const sw = computed(() => language.value === 'kiswahili');
const catalogueLink = computed(() => ({ path: `/${hub.value}`, query: { section: 'adt' } }));
const { data, error, status, refresh } = await useFetch<AdtReaderBook>(() => `/api/adt/books/${encodeURIComponent(String(route.params.bookId))}`, {
  query: computed(() => ({ educationLevel: hub.value })),
});
const missing = computed(() => error.value?.statusCode === 404);
const unconfigured = computed(() => error.value?.statusCode === 503);
const readerForbidden = computed(() => error.value?.statusCode === 403);
const frameLoaded = ref(false);
const frameFailed = ref(false);
const expired = ref(false);
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
watch(() => data.value?.reader, reader => {
  frameLoaded.value = false;
  frameFailed.value = false;
  expired.value = false;
  if (expiryTimer) clearTimeout(expiryTimer);
  if (import.meta.client && reader) {
    expiryTimer = setTimeout(() => { expired.value = true; }, Math.max(0, Date.parse(reader.expiresAt) - Date.now()));
  }
}, { immediate: true });
onBeforeUnmount(() => { if (expiryTimer) clearTimeout(expiryTimer); });
const text = computed(() => sw.value ? {
  back: 'Rudi kwenye vitabu vya ADT', reader: 'Kisomaji cha ADT', loading: 'Inapakia kitabu...',
  permission: 'Ruhusa ya kusoma haijawezeshwa', permissionHelp: 'Msimamizi anahitaji kuwezesha ruhusa ya Book reader kwenye ufunguo wa API wa ADT Store.',
  notFound: 'Kitabu hakijapatikana', notFoundHelp: 'Kitabu hiki hakipatikani katika ngazi hii ya elimu au hakijaidhinishwa kwa usomaji.',
  error: 'Kitabu hakipatikani kwa sasa', errorHelp: 'Hatukuweza kupakia kitabu. Tafadhali jaribu tena.',
  setup: 'Maktaba ya ADT bado haijaunganishwa', setupHelp: 'Muunganisho wa ADT Store ukiwekwa, maelezo ya kitabu yataonekana hapa.',
  retry: 'Jaribu tena', pages: 'kurasa',
  expired: 'Kiungo cha kusoma kimeisha muda', expiredHelp: 'Fungua upya kitabu ili kuendelea kusoma.', reload: 'Fungua upya kitabu',
} : {
  back: 'Back to ADT books', reader: 'ADT reader', loading: 'Loading book...',
  permission: 'Reading permission is not enabled', permissionHelp: 'An administrator needs to enable the Book reader permission on the ADT Store integration key.',
  notFound: 'Book not found', notFoundHelp: 'This book is not available in this education category or has not been approved for learners.',
  error: 'Book temporarily unavailable', errorHelp: 'We could not load this book. Please try again.',
  setup: 'The ADT library is not connected yet', setupHelp: 'Book information will appear here once the ADT Store connection is configured.',
  retry: 'Try again', pages: 'pages',
  expired: 'Your reading link has expired', expiredHelp: 'Reload the book to continue reading.', reload: 'Reload book',
});
useHead({ title: computed(() => `${data.value?.book.title ?? text.value.reader} | TIE OpSchool`) });
</script>

<template>
  <NuxtLayout name="home-layout" :education-level="hub" :language="language">
    <div class="w-full py-6 sm:py-8">
      <NuxtLink :to="catalogueLink" class="mb-6 inline-flex items-center gap-2 rounded text-sm font-semibold text-oceanBlue hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue">
        <Icon name="mdi:chevron-left" class="h-5 w-5" aria-hidden="true" />{{ text.back }}
      </NuxtLink>
      <div v-if="status === 'pending'" role="status" class="py-24 text-center text-gray-600">{{ text.loading }}</div>
      <AdtStatePanel v-else-if="error || !data" state-role="alert" heading-tag="h1"
        :title="readerForbidden ? text.permission : missing ? text.notFound : unconfigured ? text.setup : text.error"
        :description="readerForbidden ? text.permissionHelp : missing ? text.notFoundHelp : unconfigured ? text.setupHelp : text.errorHelp">
        <button v-if="!missing && !unconfigured" type="button" class="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oceanBlue" @click="refresh()">{{ text.retry }}</button>
      </AdtStatePanel>
      <template v-else>
        <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><p class="mb-2 text-xs font-bold uppercase tracking-widest text-oceanBlue">{{ text.reader }}</p>
            <h1 class="text-2xl font-bold text-deepBlue sm:text-3xl">{{ data.book.title }}</h1></div>
          <div class="flex gap-2 text-sm text-gray-600"><span class="rounded-lg bg-sky-50 px-3 py-2">{{ data.book.language }}</span><span class="rounded-lg bg-sky-50 px-3 py-2">ADT Web</span></div>
        </header>
        <AdtStatePanel v-if="expired || frameFailed" heading-tag="h2" :title="expired ? text.expired : text.error" :description="expired ? text.expiredHelp : text.errorHelp">
          <button type="button" class="mt-5 rounded-xl bg-primary px-6 py-3 font-semibold text-white" @click="refresh()">{{ text.reload }}</button>
        </AdtStatePanel>
        <section v-else class="relative overflow-hidden rounded-xl border border-gray-200 bg-white" :aria-label="text.reader">
          <p v-if="!frameLoaded" role="status" class="absolute inset-x-0 top-0 bg-white p-4 text-center text-gray-600">{{ text.loading }}</p>
          <iframe :key="data.reader.url" :src="data.reader.url" :title="data.book.title" class="block h-[80dvh] min-h-[500px] w-full border-0"
            sandbox="allow-scripts" referrerpolicy="no-referrer" allow="fullscreen" @load="frameLoaded = true" @error="frameFailed = true" />
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>
