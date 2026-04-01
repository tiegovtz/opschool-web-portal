<script setup lang="ts">
import { computed, ref } from "vue";
import DropDownMenu from "~/components/customDropDown/dropDownMenu.vue";
import type { LanguageSupport } from "~/types/language.interface";

const props = withDefaults(
  defineProps<{
    activeTab: string;
    resultsCount?: number;
    filterValue?: Record<string, any> | any[];
    showFilters?: boolean;
    language?: LanguageSupport;
  }>(),
  {
    resultsCount: 0,
    filterValue: () => ({}),
    showFilters: true,
    language: "english",
  }
);

const emit = defineEmits<{
  (e: "update-filter", value: Record<string, any> | any[]): void;
  (e: "reset-filter"): void;
}>();

const hideFilter = ref(false);

const isSubjectsTab = computed(() => props.activeTab === "subjects");

const hasActiveFilter = computed(() => {
  if (Array.isArray(props.filterValue)) return props.filterValue.length > 0;
  if (props.filterValue && typeof props.filterValue === "object") {
    return Object.keys(props.filterValue).length > 0;
  }
  return false;
});

const token = useCookie("signInAccessToken");

const handleFilterUpdate = (value: Record<string, any> | any[]) => {
  emit("update-filter", value);
};

const handleReset = () => {
  emit("reset-filter");
};
</script>

<template>
  <div>
    <div class="flex items-center justify-between py-2 xl:hidden">
      <ClientOnly>
        <p class="font-medium text-small" aria-live="polite">
          Viewing {{ resultsCount || 0 }} Results
        </p>
      </ClientOnly>
      <button v-if="showFilters" class="flex items-center gap-2 cursor-pointer text-deepBlue"
        @click="hideFilter = !hideFilter" :aria-expanded="hideFilter" aria-label="Toggle filters">
        <IconsFilterFill :size="24" aria-hidden="true" />
        <p class="text-medium">Filters</p>
      </button>
      <div v-if="showFilters && !isSubjectsTab" :class="[
        'fixed top-0 left-0 h-full w-full flex flex-col items-start justify-center transition-all duration-700 ease-in-out bg-black/40',
        hideFilter ? 'z-30' : '-z-30',
      ]">
        <div class="w-full h-full bg-white md:w-80">
          <div class="flex items-center justify-end">
            <button class="flex items-center justify-center w-10 h-10 p-2 cursor-pointer rounded-bl-md bg-deepBlue"
              @click="hideFilter = !hideFilter" aria-label="Close filters">
              <IconsClose :size="24" class="font-bold text-white" aria-hidden="true" />
            </button>
          </div>
          <div class="flex flex-col gap-4 mt-10">
            <DropDownMenu :active-tab="activeTab" :language="language" @emit-update-filter-value="handleFilterUpdate" />
            <!-- <button v-if="hasActiveFilter" type="button" class="px-4 py-2 text-left cursor-pointer text-oceanBlue"
              @click="handleReset">
              Reset filters
            </button> -->
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-center w-full gap-4 xl:items-start">
      <div v-if="showFilters && !isSubjectsTab" aria-label="Filters" role="group"
        class="sticky flex-col items-start hidden w-1/4 p-2 pb-4 my-5 bg-white rounded-md xl:flex top-10 custom-box-shadow">
        <DropDownMenu :active-tab="activeTab" :language="language" :filter-value="[]" @emit-update-filter-value="handleFilterUpdate" />
        <!-- <button v-if="hasActiveFilter" type="button" class="px-2 pt-2 cursor-pointer text-oceanBlue"
          @click="handleReset">
          Reset filters
        </button> -->
      </div>

      <div :class="['w-full', !isSubjectsTab && token ? 'xl:w-3/4' : '']" id="main-container" aria-label="content list"
        role="region" tabindex="-1">
        <slot />
      </div>
    </div>
  </div>
</template>
