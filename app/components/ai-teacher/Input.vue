<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  chat: any;
  draftMessage?: string;
  draftVersion?: number;
}>();

const input = ref("");
const emit = defineEmits<{
  sendMessage: [message: string];
}>();

watch(
  () => [props.draftMessage, props.draftVersion],
  ([draftMessage]) => {
    if (typeof draftMessage === "string" && draftMessage.trim()) {
      input.value = draftMessage;
    }
  },
  { immediate: true }
);

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  emit("sendMessage", input.value);
  input.value = "";
};
</script>

<template>
  <form id="main-container" tabindex="-1"  @submit.prevent="handleSubmit" class="w-full border-t border-gray-200 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:px-5 sm:pt-5" role="form"
    aria-label="Ask a question to AI teacher">
    <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:p-2">
      <div class="relative h-12 flex-1 sm:h-14">
        <!-- Screen-reader label -->
        <label for="question-input" class="sr-only">
          Type your question
        </label>

        <input  id="question-input" v-model="input" type="text" placeholder="Type your question here..."
          class="h-full w-full rounded-2xl border-gray-200 bg-gray-50 px-4 pr-12 text-sm transition-all focus:border-oceanBlue focus:outline-none focus:ring focus:ring-oceanBlue sm:px-5"
          aria-required="true" aria-describedby="question-help" autocomplete="off" />

        <!-- Helper text (screen readers only) -->
        <span id="question-help" class="sr-only">
          Press Enter or click Send to submit your question
        </span>
      </div>

      <button type="submit"
        class="flex items-center justify-center gap-2 rounded-2xl bg-oceanBlue px-5 py-3 font-semibold text-white shadow-lg transition-all group hover:shadow-xl sm:px-6 sm:py-3.5"
        aria-label="Send prompt to AI teacher">
        <span>Send</span>
        <Icon name="heroicons:arrow-up-right" class="w-5 h-5 transition transform group-hover:translate-x-1"
          aria-hidden="true" />
      </button>

      <!-- <button
            type="button"
            class="absolute text-gray-400 transition -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
          >
            <Icon
              name="heroicons:paper-clip"
              class="w-5 h-5"
            />
          </button> -->
    </div>
  </form>
</template>
