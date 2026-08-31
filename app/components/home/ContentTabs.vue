<script setup lang="ts">
const props = defineProps<{ active: string; language: 'english' | 'kiswahili' }>();
const emit = defineEmits<{ select: [section: string] }>();
const items = computed(() => [
  { id: 'subjects', label: props.language === 'kiswahili' ? 'Masomo' : 'Subjects', icon: 'mdi:school-outline' },
  { id: 'interactive-content', label: props.language === 'kiswahili' ? 'Maudhui Shirikishi' : 'Interactive content', icon: 'mdi:briefcase-outline' },
  { id: 'adt', label: props.language === 'kiswahili' ? 'KKD' : 'ADT', icon: 'mdi:book-open-page-variant-outline' },
]);
function navigateTabs(event: KeyboardEvent, index: number) {
  const count = items.value.length;
  const next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index + count - 1) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : -1;
  if (next < 0) return;
  event.preventDefault();
  const id = items.value[next]!.id;
  document.getElementById(`hub-tab-${id}`)?.focus();
  emit('select', id);
}
</script>

<template>
  <div role="tablist" :aria-label="language === 'kiswahili' ? 'Aina ya maudhui' : 'Content type'" class="mt-6 flex gap-2 overflow-x-auto border-b border-gray-200">
    <button v-for="(item, index) in items" :id="`hub-tab-${item.id}`" :key="item.id" type="button" role="tab"
      :aria-selected="active === item.id" aria-controls="hub-content-panel" :tabindex="active === item.id ? 0 : -1"
      class="inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue"
      :class="active === item.id ? 'border-oceanBlue bg-sky-50 text-deepBlue' : 'border-transparent text-gray-600 hover:bg-gray-50'"
      @click="emit('select', item.id)" @keydown="navigateTabs($event, index)">
      <Icon :name="item.icon" class="h-5 w-5" aria-hidden="true" />{{ item.label }}
    </button>
  </div>
</template>
