<template>
  <header class="border-b border-gray-100 bg-white px-4 py-4 sm:px-8 sm:py-6">
    <div class="flex items-center gap-3">
      <button
        @click="$emit('toggle-sidebar')"
        class="flex items-center justify-center w-10 h-10 transition-all rounded-full shadow-md cursor-pointer sm:h-12 sm:w-12 hover:shadow-lg active:scale-95"
        aria-label="Toggle chat history"
      >
        <Icon
          name="heroicons:bars-3"
          class="w-5 h-5 sm:w-6 sm:h-6"
        />
      </button>

      <!-- Text content -->
      <div
        tabindex="0"
        class="min-w-0 text-gray-900"
      >
        <h1 class="text-sm font-semibold leading-tight text-slate-900 sm:text-base">
          TIE AI Teacher
        </h1>
        <p
          class="text-xs text-slate-500 sm:text-sm"
          id="app-description"
        >
          Your intelligent learning companion
        </p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  "toggle-sidebar": [];
}>();
</script>
