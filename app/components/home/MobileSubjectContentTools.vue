<script setup lang="ts">
import type { LanguageSupport } from "~/types/language.interface";
import type { tabs } from "~/types/types.data";
import { getEducationHubBucket, getEducationRouteQuery, normalizeEducationLevel } from "~/utilities/educationRoute";

const props = defineProps<{
  activeTab: tabs;
  language: LanguageSupport;
  educationLevel: string;
}>();

const emit = defineEmits<{
  selectTab: [tab: tabs];
  'update:selectedLevel': [level: string];
}>();

const panel = ref<"filters" | "search" | null>(null);
const route = useRoute();
const router = useRouter();
const selectedContentType = ref<tabs>(props.activeTab);
const selectedEducationLevel = ref<string>(props.educationLevel);
const selectedClass = ref(typeof route.query.level === "string" ? route.query.level : "");
const filterButton = ref<HTMLButtonElement | null>(null);
const searchButton = ref<HTMLButtonElement | null>(null);
const isSwahili = computed(() => props.language === "kiswahili");
watch(() => props.activeTab, value => { selectedContentType.value = value; });
const contentTypes = computed(() => isSwahili.value ? [
  { id: "interactive-contents", name: "Maudhui Shirikishi" },
  { id: "video", name: "Video za Mafunzo" },
  { id: "class-videos", name: "Video za Darasani" },
  { id: "learn-activities", name: "Majaribio" },
  { id: "audio", name: "Sauti" },
] : [
  { id: "interactive-contents", name: "Interactive Content" },
  { id: "video", name: "Instructional Videos" },
  { id: "class-videos", name: "Class Videos" },
  { id: "learn-activities", name: "Experiments" },
  { id: "audio", name: "Audio" },
]);

const closePanel = async () => {
  const previous = panel.value;
  panel.value = null;
  await nextTick();
  (previous === "filters" ? filterButton.value : searchButton.value)?.focus();
};

const applyFilters = async () => {
  const bucket = getEducationHubBucket(props.educationLevel) ?? "secondary";
  const nextLevel = selectedEducationLevel.value && selectedEducationLevel.value !== "all"
    ? normalizeEducationLevel(selectedEducationLevel.value)
    : bucket;
  if (nextLevel !== props.educationLevel) {
    await router.replace({
      path: route.path,
      query: {
        ...route.query,
        ...getEducationRouteQuery(nextLevel, {}, props.language),
        sublevel: nextLevel === bucket ? undefined : nextLevel,
        level: selectedClass.value || undefined,
      },
    });
  } else if (selectedClass.value !== route.query.level) {
    await router.replace({ path: route.path, query: { ...route.query, level: selectedClass.value || undefined } });
  }
  emit("update:selectedLevel", selectedClass.value);
  const nextTab = selectedContentType.value;
  panel.value = null;
  if (nextTab !== props.activeTab) emit("selectTab", nextTab);
};
</script>

<template>
  <div class="mt-4 grid grid-cols-2 gap-3 md:hidden" role="group" :aria-label="isSwahili ? 'Zana za maudhui' : 'Content tools'">
    <button ref="filterButton" type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_3px_12px_rgba(15,23,42,0.12)]" :class="panel === 'filters' ? 'border-oceanBlue' : 'border-transparent'" :aria-expanded="panel === 'filters'" aria-controls="mobile-subject-filters" @click="panel = 'filters'">
      <Icon name="mdi:tune-variant" size="20" aria-hidden="true" />{{ isSwahili ? 'Vichujio' : 'Filters' }}
    </button>
    <button ref="searchButton" type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_3px_12px_rgba(15,23,42,0.12)]" :class="panel === 'search' ? 'border-oceanBlue' : 'border-transparent'" :aria-expanded="panel === 'search'" aria-controls="mobile-subject-search" @click="panel = 'search'">
      <Icon name="mdi:magnify" size="20" aria-hidden="true" />{{ isSwahili ? 'Tafuta' : 'Search' }}
    </button>
  </div>
  <div v-if="panel" class="fixed inset-0 z-[70] bg-slate-950/50 md:hidden" @click="closePanel" />
  <div v-show="panel === 'filters'" id="mobile-subject-filters" class="fixed inset-x-4 top-4 z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl md:hidden" role="dialog" aria-modal="true" :aria-label="isSwahili ? 'Vichujio' : 'Filters'" @keydown.esc.stop="closePanel">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-slate-900">{{ isSwahili ? 'Vichujio' : 'Filters' }}</h2>
      <button type="button" class="flex size-10 items-center justify-center rounded-full text-slate-600" :aria-label="isSwahili ? 'Funga vichujio' : 'Close filters'" @click="closePanel"><Icon name="mdi:close" size="24" aria-hidden="true" /></button>
    </div>
    <div class="mt-5">
      <p class="mb-1 text-xs font-semibold text-slate-700">{{ isSwahili ? 'Aina ya maudhui' : 'Content type' }}</p>
      <CustomDropDownList :model-value="selectedContentType" :list="contentTypes" :searchable="false" button-class="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm" @update-model-value="selectedContentType = String($event) as tabs" />
    </div>
    <HomeInputsSelection :education-level="getEducationHubBucket(educationLevel) ?? 'secondary'" :selected-sublevel="educationLevel" :selected-standard="selectedClass" :language="language" hide-search hide-subject show-labels compact suppress-initial-emit @emit-level="selectedEducationLevel = $event" @emit-standard="selectedClass = $event" />
    <button type="button" class="mt-6 flex min-h-11 w-full items-center justify-center rounded-lg bg-oceanBlue px-4 text-sm font-semibold text-white" @click="applyFilters">{{ isSwahili ? 'Onyesha matokeo' : 'Show results' }}</button>
  </div>
  <div v-if="panel === 'search'" id="mobile-subject-search" class="fixed inset-x-4 top-4 z-[71] rounded-2xl bg-white p-4 shadow-2xl md:hidden" role="dialog" aria-modal="true" :aria-label="isSwahili ? 'Tafuta maudhui' : 'Search content'" @keydown.esc.stop="closePanel">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-bold text-slate-900">{{ isSwahili ? 'Tafuta' : 'Search' }}</h2>
      <button type="button" class="flex size-10 items-center justify-center rounded-full text-slate-600" :aria-label="isSwahili ? 'Funga utafutaji' : 'Close search'" @click="closePanel"><Icon name="mdi:close" size="24" aria-hidden="true" /></button>
    </div>
    <HomeSearchbar :language="language" :education-level="educationLevel" />
  </div>
</template>
