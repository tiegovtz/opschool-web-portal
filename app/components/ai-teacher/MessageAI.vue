<template>
  <div class="flex justify-start animate-fade-in">
    <div class="flex gap-3 max-w-[85%]">
      <div
        class="w-8 h-8 bg-oceanBlue rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md"
      >
        <Icon
          name="heroicons:bolt"
          class="w-5 h-5 text-white"
        />
      </div>

      <div
        class="bg-white text-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-100"
      >
        <div
          v-for="(part, idx) in message.parts"
          :key="idx"
          class="space-y-2"
        >
          <!-- Markdown Support -->
          <div
            v-if="part.type === 'text'"
            class="prose prose-sm max-w-none"
            v-html="md.render(part.text)"
          ></div>

          <!-- Tools -->
          <pre
            v-if="part.type.startsWith('tool-')"
            class="text-xs bg-gray-50 p-3 rounded-lg mt-2 overflow-x-auto border border-gray-200"
          >
            {{ JSON.stringify(part, null, 2) }}
          </pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
const md = new MarkdownIt({ html: false, breaks: true, linkify: true });
defineProps<{ message: any }>();
</script>
