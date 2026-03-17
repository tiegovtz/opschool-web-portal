<script setup lang="ts">
import { computed } from "vue";
import { CustomDropDownList } from "#components";

type PageSizeOption = {
  id: string;
  name: string;
};

const props = defineProps<{
  showing: number;
  total: number;
  itemLabel: string;
  page: number;
  pageCount: number;
  pageSizeSelection: string;
  customPageSize: string;
  pageSizeOptions: PageSizeOption[];
  pageSizeDropdownId: string;
  customInputPlaceholder?: string;
  customInputAriaLabel: string;
}>();

const emit = defineEmits<{
  (event: "prev"): void;
  (event: "next"): void;
  (event: "update:pageSizeSelection", value: string): void;
  (event: "update:customPageSize", value: string): void;
}>();

const pageSizeSelectionModel = computed({
  get: () => props.pageSizeSelection,
  set: (value: string | number | null) => emit("update:pageSizeSelection", String(value ?? "")),
});

const customPageSizeModel = computed({
  get: () => props.customPageSize,
  set: (value: string | number | null) => emit("update:customPageSize", String(value ?? "")),
});

const canGoPrev = computed(() => props.page > 1);
const canGoNext = computed(() => props.page < props.pageCount);
</script>

<template>
  <div class="mt-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
    <p class="text-sm text-gray-600 xl:whitespace-nowrap">
      Showing {{ showing }} of {{ total }} {{ itemLabel }}
    </p>

    <div class="flex w-full flex-col gap-3 xl:w-auto xl:flex-row xl:items-center">
      <div class="grid w-full grid-cols-1 gap-2 text-sm md:grid-cols-[auto,minmax(0,9rem),6rem] md:items-center md:gap-2 xl:mr-3 xl:w-auto">
        <label class="text-gray-600 md:whitespace-nowrap" :for="pageSizeDropdownId">Page size</label>
        <div class="w-full md:w-36">
          <CustomDropDownList
            :id="pageSizeDropdownId"
            v-model="pageSizeSelectionModel"
            :list="pageSizeOptions"
            placeholder="Page size"
            buttonClass="h-9 w-full px-3 py-1.5 text-sm whitespace-nowrap"
          />
        </div>
        <input
          v-model="customPageSizeModel"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          :aria-label="customInputAriaLabel"
          :placeholder="customInputPlaceholder || 'Custom'"
          class="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-24"
        />
      </div>

      <div class="grid w-full grid-cols-3 items-center gap-2 md:flex md:w-auto md:gap-2">
        <button
          type="button"
          class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
          :disabled="!canGoPrev"
          @click="emit('prev')"
        >
          Previous
        </button>

        <span class="px-1 text-center text-sm font-medium text-gray-600">
          Page {{ page }} / {{ pageCount }}
        </span>

        <button
          type="button"
          class="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
          :disabled="!canGoNext"
          @click="emit('next')"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
