<script setup lang="ts">
import { emptyAdtFilters, filterAdtBooks, type AdtCatalogue, type AdtHub } from '~~/shared/adt/catalogue';

const props = defineProps<{ hub: AdtHub; language: 'english' | 'kiswahili' }>();
const hub = computed(() => props.hub);
const language = computed(() => props.language);
const sw = computed(() => language.value === 'kiswahili');
const filters = reactive(emptyAdtFilters());
const page = ref(1);
const filtersKey = ref(0);
function resetFilters() { Object.assign(filters, emptyAdtFilters()); filtersKey.value++; }
const pageSize = 12;
const { data, status, error, refresh } = await useFetch<AdtCatalogue>('/api/adt/catalogue', {
  server: false,
  lazy: true,
  immediate: false,
  query: computed(() => ({ educationLevel: hub.value })),
});
// Keep the server skeleton and first client render identical, even when the API
// responds before the async layout finishes hydrating.
onMounted(() => { refresh(); });
const catalogue = computed<AdtCatalogue>(() => data.value ?? ({ configured: false, preview: false, books: [], levels: [], classes: [], subjects: [], languages: [], curricula: [] }));
const loading = computed(() => status.value === 'idle' || status.value === 'pending');
const enabled = computed(() => !loading.value && !error.value && catalogue.value.configured);
const results = computed(() => filterAdtBooks(catalogue.value, filters));
const pageCount = computed(() => Math.max(1, Math.ceil(results.value.length / pageSize)));
const visibleBooks = computed(() => results.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const hasFilters = computed(() => Object.values(filters).some(Boolean));
watch(() => filters.class, () => { filters.subject = ''; });
watch(filters, () => { page.value = 1; });
watch(data, () => { resetFilters(); page.value = 1; });

const text = computed(() => sw.value ? {
  home: 'Mwanzo', category: 'Msingi', title: 'Vitabu vya ADT',
  intro: 'Gundua vitabu vya kidijitali vyenye vipengele vya ufikivu. Tafuta kitabu kulingana na ngazi, darasa na somo lako.',
  search: 'Tafuta vitabu', searchHint: 'Tafuta kwa jina la kitabu, somo au ISBN...',
  level: 'Ngazi ya elimu', allLevels: 'Ngazi zote', class: 'Darasa', allClasses: 'Madarasa yote',
  selectLevel: 'Chagua ngazi kwanza', subject: 'Somo', allSubjects: 'Masomo yote', selectClass: 'Chagua darasa kwanza',
  language: 'Lugha ya kitabu', allLanguages: 'Lugha zote', curriculum: 'Mtaala', allCurricula: 'Mitaala yote',
  reset: 'Futa vichujio', books: 'vitabu', collection: 'Mkusanyiko wa vitabu',
  empty: 'Hakuna vitabu vilivyopatikana', emptyHelp: 'Jaribu neno lingine au futa vichujio ili kuona vitabu zaidi.',
  noBooks: 'Vitabu vinakuja hivi karibuni', noBooksHelp: 'Vitabu vya ADT vilivyoidhinishwa vitaonekana hapa vinapopatikana.',
  unavailable: 'Vitabu havipatikani kwa sasa', errorHelp: 'Hatukuweza kuunganisha na ADT Store. Tafadhali jaribu tena.', retry: 'Jaribu tena',
  notConnected: 'Maktaba ya ADT bado haijaunganishwa', setup: 'Muunganisho wa ADT Store ukiwekwa, vitabu vilivyoidhinishwa vitaonekana hapa.',
  previous: 'Iliyotangulia', next: 'Inayofuata', page: 'Ukurasa', of: 'kati ya', loading: 'Inapakia vitabu...',
} : {
  home: 'Home', category: hub.value === 'primary' ? 'Primary' : 'Secondary', title: 'ADT books',
  intro: 'Explore accessible digital textbooks. Find your next book by education level, class and subject.',
  search: 'Search books', searchHint: 'Search by book title, subject or ISBN...',
  level: 'Education level', allLevels: 'All levels', class: 'Class', allClasses: 'All classes',
  selectLevel: 'Select a level first', subject: 'Subject', allSubjects: 'All subjects', selectClass: 'Select a class first',
  language: 'Book language', allLanguages: 'All languages', curriculum: 'Curriculum', allCurricula: 'All curricula',
  reset: 'Clear filters', books: results.value.length === 1 ? 'book' : 'books', collection: 'Book collection',
  empty: 'No matching books', emptyHelp: 'Try another search or clear your filters to discover more books.',
  noBooks: 'Books are on their way', noBooksHelp: 'Approved ADT books will appear here when they are available.',
  unavailable: 'Books are temporarily unavailable', errorHelp: 'We could not connect to ADT Store. Please try again.', retry: 'Try again',
  notConnected: 'The ADT library is not connected yet', setup: 'Once the ADT Store connection is configured, approved books will appear here.',
  previous: 'Previous', next: 'Next', page: 'Page', of: 'of', loading: 'Loading books...',
});
function changePage(next: number) {
  page.value = next;
  document.getElementById('adt-results')?.focus();
}
</script>

<template>
  <div class="w-full pb-6">
      <HomeInputsSelection :key="filtersKey" :language="language" :education-level="hub" :classifications="catalogue" :disabled="!enabled"
        @emit-level="filters.level = $event" @emit-standard="filters.class = $event" @emit-subject="filters.subject = $event" @emit-search="filters.search = $event" />
      <button v-if="hasFilters" type="button" class="mb-5 text-sm font-semibold text-oceanBlue underline" @click="resetFilters">{{ text.reset }}</button>
      <section id="adt-results" tabindex="-1" :aria-label="text.collection" :aria-busy="loading" class="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue">
        <div class="mb-5 flex items-center justify-between gap-3">
          <h2 class="text-xl font-bold text-deepBlue">{{ text.collection }}</h2>
          <p v-if="enabled" role="status" class="text-sm text-gray-600">{{ results.length }} {{ text.books }}</p>
        </div>
        <div v-if="loading" role="status">
          <span class="sr-only">{{ text.loading }}</span>
          <div aria-hidden="true" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AdtBookCardSkeleton v-for="card in 8" :key="card" />
          </div>
        </div>
        <AdtStatePanel v-else-if="error || !enabled || !results.length" :state-role="error ? 'alert' : 'status'"
          :title="error ? text.unavailable : !enabled ? text.notConnected : catalogue.books.length ? text.empty : text.noBooks"
          :description="error ? text.errorHelp : !enabled ? text.setup : catalogue.books.length ? text.emptyHelp : text.noBooksHelp">
          <button v-if="error" type="button" class="mt-5 rounded-lg bg-oceanBlue px-5 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oceanBlue" @click="refresh()">{{ text.retry }}</button>
          <button v-else-if="hasFilters" type="button" class="mt-5 rounded text-sm font-semibold text-oceanBlue underline" @click="resetFilters">{{ text.reset }}</button>
        </AdtStatePanel>
        <template v-else>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AdtBookCard v-for="book in visibleBooks" :key="book.id" :book="book" :classifications="catalogue" :hub="hub" :kiswahili="sw" />
          </div>
          <nav v-if="pageCount > 1" :aria-label="text.page" class="mt-7 flex flex-wrap items-center justify-center gap-4 text-sm">
            <button type="button" :disabled="page === 1" class="rounded-lg border px-4 py-2 disabled:opacity-40" @click="changePage(page - 1)">{{ text.previous }}</button>
            <span>{{ text.page }} {{ page }} {{ text.of }} {{ pageCount }}</span>
            <button type="button" :disabled="page === pageCount" class="rounded-lg border px-4 py-2 disabled:opacity-40" @click="changePage(page + 1)">{{ text.next }}</button>
          </nav>
        </template>
      </section>
    </div>
</template>
