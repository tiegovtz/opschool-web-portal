<script setup lang="ts">
import { ref } from "vue";
defineProps<{ chat: any }>();

const input = ref("");
const emit = defineEmits<{
  sendMessage: [message: string];
}>();

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  emit("sendMessage", input.value);
  input.value = "";
};
</script>

<template>
  <form id="main-container" tabindex="-1"  @submit.prevent="handleSubmit" class="w-full p-5 bg-transparent border-t border-gray-200" role="form"
    aria-label="Ask a question to AI teacher">
    <div class="flex items-end gap-3 p-2">
      <div class="relative flex-1 h-14">
        <!-- Screen-reader label -->
        <label for="question-input" class="sr-only">
          Type your question
        </label>

        <input  id="question-input" v-model="input" type="text" placeholder="Type your question here..."
          class="w-full h-full px-5 pr-12 text-sm transition-all border-gray-200 rounded-2xl focus:outline-none focus:border-oceanBlue focus:ring focus:ring-oceanBlue bg-gray-50"
          aria-required="true" aria-describedby="question-help" autocomplete="off" />

        <!-- Helper text (screen readers only) -->
        <span id="question-help" class="sr-only">
          Press Enter or click Send to submit your question
        </span>
      </div>

      <button type="submit"
        class="bg-oceanBlue hover:from-[#093f7a] hover:to-[#0a52a1] text-white px-6 py-3.5 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
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
