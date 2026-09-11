<script setup lang="ts">
import { useElementBounding, useEventListener, useWindowSize } from '@vueuse/core';

const props = defineProps<{ active: string; language: 'english' | 'kiswahili' }>();
const emit = defineEmits<{ select: [section: string] }>();
const tooltipId = `adt-tab-description-${useId()}`;
const tooltipAnchor = ref<HTMLElement | null>(null);
const tooltipElement = ref<HTMLElement | null>(null);
const hovered = ref(false);
const focused = ref(false);
const dismissed = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | undefined;
const tooltipOpen = computed(() => !dismissed.value && (hovered.value || focused.value));
const tooltipCopy = computed(() => props.language === 'kiswahili' ? {
  title: 'Kitabu cha Kiada cha Dijiti',
  description: 'Vitabu vya kiada vya dijiti vilivyoundwa kusaidia wanafunzi wenye mahitaji mbalimbali kujifunza kwa urahisi, kwa kutumia vipengele kama maandishi, sauti, picha na shughuli shirikishi.',
} : {
  title: 'Accessible Digital Textbooks',
  description: 'Digital textbooks designed to make learning accessible to learners with different needs, with features such as text, audio, images and interactive activities.',
});
const anchorBounds = useElementBounding(tooltipAnchor);
const { height: tooltipHeight } = useElementBounding(tooltipElement);
const { width: windowWidth, height: windowHeight } = useWindowSize();
const tooltipStyle = computed(() => {
  const width = Math.min(320, windowWidth.value - 24);
  const left = Math.max(12, Math.min(anchorBounds.left.value + anchorBounds.width.value / 2 - width / 2, windowWidth.value - width - 12));
  const below = anchorBounds.bottom.value + 8;
  const top = below + tooltipHeight.value <= windowHeight.value - 12 ? below : Math.max(12, anchorBounds.top.value - tooltipHeight.value - 8);
  return { width: `${width}px`, left: `${left}px`, top: `${top}px` };
});
function showTooltip(event: Event, byFocus = false) {
  tooltipAnchor.value = event.currentTarget as HTMLElement;
  anchorBounds.update();
  dismissed.value = false;
  if (byFocus) focused.value = true;
  else keepTooltipOpen();
}
function keepTooltipOpen() {
  clearTimeout(closeTimer);
  hovered.value = true;
}
function scheduleTooltipClose() {
  // Allow the pointer to cross the small gap and hover over the description.
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => { hovered.value = false; }, 150);
}
useEventListener('keydown', event => {
  if (event.key === 'Escape' && tooltipOpen.value) dismissed.value = true;
});
onBeforeUnmount(() => clearTimeout(closeTimer));

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
      :aria-describedby="item.id === 'adt' ? tooltipId : undefined"
      class="inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue"
      :class="active === item.id ? 'border-oceanBlue bg-sky-50 text-deepBlue' : 'border-transparent text-gray-600 hover:bg-gray-50'"
      @click="emit('select', item.id)" @keydown="navigateTabs($event, index)"
      @mouseenter="item.id === 'adt' && showTooltip($event)" @mouseleave="item.id === 'adt' && scheduleTooltipClose()"
      @focus="item.id === 'adt' && showTooltip($event, true)" @blur="item.id === 'adt' && (focused = false)">
      <Icon :name="item.icon" class="h-5 w-5" aria-hidden="true" />{{ item.label }}
    </button>
  </div>
  <span :id="tooltipId" class="sr-only">{{ tooltipCopy.title }}. {{ tooltipCopy.description }}</span>
  <ClientOnly>
    <!-- Escape the horizontally scrolling tab strip so the tooltip cannot be clipped. -->
    <Teleport to="body">
      <div v-if="tooltipOpen" ref="tooltipElement" role="tooltip" :lang="language === 'kiswahili' ? 'sw' : 'en'"
        class="fixed z-50 rounded-xl border border-sky-100 bg-white px-4 py-3 text-left shadow-lg" :style="tooltipStyle"
        @mouseenter="keepTooltipOpen" @mouseleave="scheduleTooltipClose">
        <p class="text-sm font-semibold text-deepBlue">{{ tooltipCopy.title }}</p>
        <p class="mt-1 text-sm leading-relaxed text-gray-600">{{ tooltipCopy.description }}</p>
      </div>
    </Teleport>
  </ClientOnly>
</template>
