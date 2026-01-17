<template>
  <header class="py-6 px-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-oceanBlue rounded-full flex items-center justify-center backdrop-blur">
          <Icon name="heroicons:light-bulb" class="text-white w-6 h-6" />
        </div>

        <div>
          <h1 class="text-2xl font-bold">TIE AI Assistant</h1>
          <p class="text-sm ">Your intelligent learning companion</p>
        </div>
      </div>

      <button
        @click="$emit('toggleHistory')"
        class="flex items-center gap-2 px-4 py-2 bg-oceanBlue text-white rounded-lg hover:bg-opacity-90 transition-colors"
        title="Chat History"
      >
        <Icon name="heroicons:clock" class="w-5 h-5" />
        <span class="hidden sm:inline">History</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  toggleHistory: [];
}>();
</script>
