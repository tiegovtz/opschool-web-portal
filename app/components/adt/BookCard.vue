<script setup lang="ts">
import type { AdtBook, AdtClassifications, AdtHub } from '~~/shared/adt/catalogue';
const props = defineProps<{ book: AdtBook; classifications: AdtClassifications; hub: AdtHub; kiswahili: boolean }>();
const previewOpen = ref(false);
const classNames = computed(() => props.classifications.classes.filter(item => props.book.classIds.includes(item.id)).map(item => item.name).join(', '));
const subjectNames = computed(() => props.classifications.subjects.filter(item => props.book.subjectIds.includes(item.id)).map(item => item.name).join(', '));
</script>

<template>
  <article class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div class="flex h-56 items-center justify-center bg-sky-50 p-5">
      <AdtBookCover :src="book.coverUrl" :title="book.title" class="h-full" />
    </div>
    <div class="flex flex-1 flex-col gap-3 p-5">
      <p class="text-xs font-semibold uppercase tracking-wide text-oceanBlue">{{ classNames || (kiswahili ? 'Kitabu cha ADT' : 'ADT book') }}</p>
      <h3 class="text-lg font-bold leading-snug text-deepBlue">{{ book.title }}</h3>
      <p class="text-sm text-gray-600">{{ subjectNames }}</p>
      <div class="flex flex-wrap gap-2 text-xs text-gray-600">
        <span class="rounded-md bg-gray-100 px-2 py-1">{{ book.language }}</span>
        <span class="rounded-md bg-gray-100 px-2 py-1">ADT Web</span>
      </div>
      <button type="button" :aria-label="`${kiswahili ? 'Hakiki kitabu' : 'Preview book'}: ${book.title}`" aria-haspopup="dialog"
        class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oceanBlue" @click="previewOpen = true">
        <Icon name="mdi:eye-outline" class="h-5 w-5" aria-hidden="true" />{{ kiswahili ? 'Hakiki kitabu' : 'Preview book' }}
      </button>
    </div>
    <AdtBookPreviewModal v-if="previewOpen" :book="book" :classifications="classifications" :hub="hub" :kiswahili="kiswahili" @close="previewOpen = false" />
  </article>
</template>
