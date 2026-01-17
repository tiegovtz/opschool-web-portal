<template>
  <header class="py-6 px-8 border-b border-gray-100 bg-white">
    <div class="flex items-center gap-3">
      <button
        @click="$emit('toggle-sidebar')"
        class="w-12 h-12 bg-gradient-to-br from-oceanBlue to-deepBlue rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="Toggle chat history"
      >
        <Icon name="heroicons:bars-3" class="text-white w-6 h-6" />
      </button>
      <div class="w-12 h-12 bg-gradient-to-br from-oceanBlue to-deepBlue rounded-full flex items-center justify-center shadow-md">
        <Icon name="heroicons:light-bulb" class="text-white w-6 h-6" />
      </div>

      <div>
        <h1 class="text-2xl font-bold text-gray-900">TIE AI Assistant</h1>
        <p class="text-sm text-gray-500">Your intelligent learning companion</p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-sidebar': [];
}>();
</script>
