<template>
  <form
    @submit="handleSubmit"
    class="border-t border-gray-200 p-5 bg-transparent w-full"
  >
    <div class="flex items-end  gap-3 p-2">
      <div class="flex-1 relative h-14">
        <input
          v-model="input"
          placeholder="Type your question here..."
          class="w-full rounded-2xl border-gray-200 px-5 h-full pr-12 focus:outline-none focus:border-oceanBlue focus:ring focus:ring-oceanBlue bg-gray-50 transition-all text-sm"
        />
        <!-- <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
        >
          <Icon
            name="heroicons:paper-clip"
            class="w-5 h-5"
          />
        </button> -->
      </div>
      <button
        type="submit"
        class="bg-oceanBlue hover:from-[#093f7a] hover:to-[#0a52a1] text-white px-6 py-3.5 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
      >
        <span>Send</span>
        <Icon
          name="heroicons:arrow-up-right"
          class="w-5 h-5 transform group-hover:translate-x-1 transition"
        />
      </button>
    </div>
  </form>
</template>

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
