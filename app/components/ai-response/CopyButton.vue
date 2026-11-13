<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { copyResponseText, htmlToCopyText } from "~/utilities/clipboard";
import type { LanguageSupport } from "~/types/language.interface";

const props = withDefaults(defineProps<{
  text: string;
  language?: LanguageSupport;
  html?: boolean;
  disabled?: boolean;
}>(), { language: "english", html: false, disabled: false });

const state = ref<"idle" | "copying" | "copied" | "error">("idle");
let resetTimer: ReturnType<typeof setTimeout> | undefined;
let version = 0;
const labels = computed(() => props.language === "kiswahili" ? {
  copy: "Nakili", title: "Nakili jibu", copied: "Imenakiliwa!",
  retry: "Jaribu tena", error: "Imeshindikana kunakili. Tafadhali jaribu tena.",
} : {
  copy: "Copy", title: "Copy response", copied: "Copied!",
  retry: "Try again", error: "Couldn’t copy. Please try again.",
});

const reset = () => {
  version++;
  clearTimeout(resetTimer);
  state.value = "idle";
};
watch(() => [props.text, props.html, props.disabled], reset);
onBeforeUnmount(reset);

const copy = async () => {
  if (props.disabled || state.value === "copying") return;
  reset();
  const requestVersion = version;
  state.value = "copying";
  try {
    const text = props.html ? htmlToCopyText(props.text) : props.text.trim();
    if (!text) throw new Error("Empty response");
    await copyResponseText(text);
    if (requestVersion !== version) return;
    state.value = "copied";
    resetTimer = setTimeout(reset, 2000);
  } catch {
    if (requestVersion === version) state.value = "error";
  }
};
</script>

<template>
  <div v-if="text.trim()" class="mt-2 flex flex-wrap items-center gap-2">
    <button
      type="button"
      :disabled="disabled"
      :aria-disabled="disabled || state === 'copying'"
      :aria-busy="state === 'copying'"
      :title="labels.title"
      :aria-label="labels.title"
      class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      @click.stop="copy"
    >
      <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path v-if="state === 'copied'" d="m5 12 4 4L19 6" />
        <template v-else>
          <rect x="8" y="8" width="12" height="13" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </template>
      </svg>
      <span>{{ state === 'copied' ? labels.copied : state === 'error' ? labels.retry : labels.copy }}</span>
    </button>
    <span role="status" aria-live="polite" :class="state === 'error' ? 'text-xs text-red-700' : 'sr-only'">
      {{ state === 'copied' ? labels.copied : state === 'error' ? labels.error : '' }}
    </span>
  </div>
</template>
