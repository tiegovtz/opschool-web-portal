<template>
  <header class="py-6 px-8 border-b border-gray-100 bg-white">
    <div class="flex items-center gap-3">
      <button
        @click="$emit('toggle-sidebar')"
        class="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="Toggle chat history"
      >
        <Icon
          name="heroicons:bars-3"
          class="w-6 h-6"
        />
      </button>

      <!-- Text content -->
      <div
        tabindex="0"
        class="text-gray-900"
      >
        <p
          class="text-sm"
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
