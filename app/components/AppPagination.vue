<script setup lang="ts">
import { computed } from "vue";
import { buildPageWindow, buildPaginationItems } from "~/utilities/pagination";

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    firstLabel?: string;
    lastLabel?: string;
    className?: string;
  }>(),
  {
    firstLabel: "First",
    lastLabel: "Last",
    className: "",
  },
);

const emit = defineEmits<{
  (event: "change", page: number): void;
}>();
const message = ref<string>();

const paginationItems = computed(() => {
  if (props.totalPages <= 0) return [];

  if (props.totalPages <= 10) {
    return Array.from({ length: props.totalPages }, (_, index) => ({
      type: "page" as const,
      value: index + 1,
    }));
  }

  return buildPaginationItems(props.totalPages, props.currentPage);
});

const mobilePaginationItems = computed(() => {
  if (props.totalPages <= 0) return [];

  return buildPageWindow(props.totalPages, props.currentPage, 5);
});

const goToPage = (page: number) => {
  const nextPageNumber = Math.min(Math.max(page, 1), Math.max(props.totalPages, 1));
  message.value = `Page ${nextPageNumber} of ${props.totalPages}`;
  emit("change", nextPageNumber);
};
</script>

<template>
  <nav
    v-if="totalPages > 0"
    :class="['flex justify-center px-3 my-10', className]"
    aria-label="Pagination"
  >
    <div class="sr-only" aria-atomic="true" aria-label="pagination info" aria-live="assertive">{{ message }}</div>
    <div class="flex w-full justify-center">
      <div class="flex w-full max-w-max flex-col items-center gap-3 text-xs text-slate-500">
        <div class="flex items-center justify-center gap-2 sm:hidden">
          <button
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-600 transition-colors duration-200 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <Icon
              name="iconamoon:arrow-left-2-light"
              size="1rem"
            />
          </button>

          <div class="grid grid-cols-5 items-center justify-items-center rounded-full border border-slate-200 bg-white/95 px-2 py-1 shadow-sm">
            <button
              v-for="item in mobilePaginationItems"
              :key="item.type === 'page' ? `mobile-${item.value}` : item.key"
              type="button"
              :aria-current="item.type === 'page' && item.value === currentPage ? 'page' : undefined"
              :class="[
                'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-all duration-200',
                item.type === 'page' && item.value === currentPage
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                  : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600',
              ]"
              @click="item.type === 'page' ? goToPage(item.value) : undefined"
            >
              {{ item.type === "page" ? item.value : "..." }}
            </button>
          </div>

          <button
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-600 transition-colors duration-200 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <Icon
              name="iconamoon:arrow-right-2-light"
              size="1rem"
            />
          </button>
        </div>

        <div class="rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-[11px] font-medium text-slate-500 sm:hidden">
          Page {{ currentPage }} of {{ totalPages }}
        </div>

        <div class="hidden items-center justify-center gap-2 sm:flex">
          <button
            type="button"
            class="px-1.5 font-medium transition-colors duration-200 hover:text-sky-600 disabled:cursor-not-allowed disabled:text-slate-300"
            :disabled="currentPage === 1"
            @click="goToPage(1)"
          >
            {{ firstLabel }}
          </button>

          <button
            type="button"
            class="flex items-center justify-center w-8 h-8 transition-colors duration-200 border rounded-full border-sky-100 bg-sky-50 text-sky-600 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <Icon
              name="iconamoon:arrow-left-2-light"
              size="0.95rem"
            />
          </button>

          <div class="flex items-center px-2 py-1 border rounded-full border-slate-200 bg-white/95 shadow-sm">
            <template
              v-for="item in paginationItems"
              :key="item.type === 'page' ? item.value : item.key"
            >
              <button
                v-if="item.type === 'page'"
                type="button"
                :aria-current="item.value === currentPage ? 'page' : undefined"
                :class="[
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all duration-200',
                  item.value === currentPage
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600',
                ]"
                @click="goToPage(item.value)"
              >
                {{ item.value }}
              </button>
              <span
                v-else
                class="flex h-8 w-8 items-center justify-center text-slate-400"
                aria-hidden="true"
              >
                ...
              </span>
            </template>
          </div>

          <button
            type="button"
            class="flex items-center justify-center w-8 h-8 transition-colors duration-200 border rounded-full border-sky-100 bg-sky-50 text-sky-600 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <Icon
              name="iconamoon:arrow-right-2-light"
              size="0.95rem"
            />
          </button>

          <button
            type="button"
            class="px-1.5 font-medium transition-colors duration-200 hover:text-sky-600 disabled:cursor-not-allowed disabled:text-slate-300"
            :disabled="currentPage === totalPages"
            @click="goToPage(totalPages)"
          >
            {{ lastLabel }}
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
