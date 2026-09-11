<script setup lang="ts">
import type { AdtCoverPreview } from '~~/shared/adt/catalogue';
const props = defineProps<{ src: string | null; preview?: AdtCoverPreview | null; title: string; loading?: 'lazy' | 'eager' }>();
const loaded = ref(false);
const previewFailed = ref(false);
const failed = ref(false);
watch(() => [props.src, props.preview?.url], () => {
  loaded.value = false;
  previewFailed.value = false;
  failed.value = false;
});
const fallback = computed(() => !props.src || failed.value);
const imageSrc = computed(() => fallback.value ? '/logo/logo_tie.webp' : (!previewFailed.value && props.preview?.url) || props.src!);
function onError() {
  if (fallback.value) return;
  loaded.value = false;
  if (props.preview?.url && !previewFailed.value) previewFailed.value = true;
  else failed.value = true;
}
</script>

<template>
  <div class="relative flex items-center justify-center overflow-hidden" :aria-busy="!loaded && !fallback">
    <img v-if="preview?.blurDataUrl && !loaded && !fallback" :src="preview.blurDataUrl" alt="" aria-hidden="true"
      :width="preview.width" :height="preview.height" class="absolute inset-0 h-full w-full object-contain" />
    <img :key="imageSrc" :src="imageSrc" :alt="fallback ? 'Tanzania Institute of Education (TIE)' : title"
      :width="!fallback && preview ? preview.width : undefined" :height="!fallback && preview ? preview.height : undefined"
      :loading="loading ?? 'lazy'" decoding="async"
      class="relative h-full w-full object-contain transition-opacity duration-300 motion-reduce:transition-none"
      :class="!loaded && preview?.blurDataUrl && !fallback ? 'opacity-0' : 'opacity-100'"
      @load="loaded = true" @error="onError" />
  </div>
</template>
