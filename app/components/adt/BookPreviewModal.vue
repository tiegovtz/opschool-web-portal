<script setup lang="ts">
import type { AdtBook, AdtClassifications, AdtHub } from '~~/shared/adt/catalogue';
const props = defineProps<{ book: AdtBook; classifications: AdtClassifications; hub: AdtHub; kiswahili: boolean }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();
const descriptionId = useId();
let previousOverflow = '';
const readerLink = computed(() => ({ path: `/${props.hub}/adt/${encodeURIComponent(props.book.id)}` }));
const classNames = computed(() => props.classifications.classes.filter(item => props.book.classIds.includes(item.id)).map(item => item.name).join(', '));
const subjectNames = computed(() => props.classifications.subjects.filter(item => props.book.subjectIds.includes(item.id)).map(item => item.name).join(', '));
onMounted(() => {
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.value?.showModal();
});
onBeforeUnmount(() => {
  dialog.value?.close();
  document.body.style.overflow = previousOverflow;
});
function close() { dialog.value?.close(); }
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" :aria-labelledby="titleId" :aria-describedby="descriptionId"
      class="adt-preview-dialog m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-5xl overflow-y-auto rounded-2xl bg-white p-0 text-gray-700 shadow-2xl"
      @close="emit('close')" @cancel.prevent="close" @keydown.esc.prevent.stop="close" @click.self="close">
      <header class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 sm:px-7">
        <div><p class="mb-1 text-xs font-semibold uppercase tracking-widest text-oceanBlue">{{ kiswahili ? 'Hakiki kitabu' : 'Book preview' }}</p>
          <h2 :id="titleId" class="text-xl font-bold text-deepBlue sm:text-2xl">{{ book.title }}</h2></div>
        <button type="button" autofocus :aria-label="kiswahili ? 'Funga hakikisho' : 'Close preview'" class="shrink-0 rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue" @click="close">
          <Icon name="mdi:close" class="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <div class="grid gap-6 p-5 sm:grid-cols-2 sm:gap-8 sm:p-8">
        <div class="flex h-72 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-6 sm:h-[28rem]">
          <AdtBookCover :src="book.coverUrl" :title="book.title" loading="eager" class="h-full" />
        </div>
        <div class="flex flex-col justify-center gap-4">
          <p :id="descriptionId" class="text-sm leading-relaxed text-gray-500">{{ kiswahili ? 'Hakikisho la jalada la kitabu. Fungua ukurasa wa kusoma ili kuendelea.' : 'A preview of the book cover. Open the dedicated reading page to continue.' }}</p>
          <dl class="grid gap-3 text-sm">
            <div v-if="classNames"><dt class="font-semibold text-deepBlue">{{ kiswahili ? 'Darasa' : 'Class' }}</dt><dd>{{ classNames }}</dd></div>
            <div v-if="subjectNames"><dt class="font-semibold text-deepBlue">{{ kiswahili ? 'Somo' : 'Subject' }}</dt><dd>{{ subjectNames }}</dd></div>
            <div><dt class="font-semibold text-deepBlue">{{ kiswahili ? 'Lugha' : 'Language' }}</dt><dd>{{ book.language }}</dd></div>
            <div v-if="book.pages"><dt class="font-semibold text-deepBlue">{{ kiswahili ? 'Kurasa' : 'Pages' }}</dt><dd>{{ book.pages }}</dd></div>
          </dl>
        </div>
      </div>
      <footer class="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:px-7">
        <button type="button" class="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue" @click="close">{{ kiswahili ? 'Funga' : 'Close' }}</button>
        <NuxtLink :to="readerLink" class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oceanBlue" @click="close">
          <Icon name="mdi:book-open-page-variant-outline" class="h-5 w-5" aria-hidden="true" />{{ kiswahili ? 'Soma kitabu' : 'Read book' }}
        </NuxtLink>
      </footer>
    </dialog>
  </Teleport>
</template>

<style scoped>
.adt-preview-dialog::backdrop { background: rgb(10 30 50 / 60%); backdrop-filter: blur(3px); }
</style>
