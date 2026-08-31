<script setup lang="ts">
const props = defineProps<{ src: string | null; title: string; loading?: 'lazy' | 'eager' }>();
const failed = ref(false);
watch(() => props.src, () => { failed.value = false; });
const fallback = computed(() => !props.src || failed.value);
</script>

<template>
  <img :src="fallback ? '/logo/logo_tie.webp' : src!" :alt="fallback ? 'Tanzania Institute of Education (TIE)' : title"
    :loading="loading ?? 'lazy'" class="max-h-full max-w-full object-contain" @error="failed = true" />
</template>
