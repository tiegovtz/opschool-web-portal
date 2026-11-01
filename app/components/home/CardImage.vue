<script setup lang="ts">
const props = withDefaults(defineProps<{
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
}>(), {
  width: 640,
  height: 360,
});

const $img = useImage();
const failedOptimization = ref(false);
const source = computed(() => {
  const value = props.src?.trim() || "/images/default.webp";
  return value.startsWith("/public/") ? value.slice("/public".length) : value;
});
watch(source, () => { failedOptimization.value = false; });
const optimizable = computed(() => {
  if (/\.(?:gif|svg)(?:[?#]|$)/i.test(source.value)) return false;
  if (source.value.startsWith("/") && !source.value.startsWith("//")) return true;
  try {
    const url = new URL(source.value);
    return ["http:", "https:"].includes(url.protocol) && $img.options.domains.includes(url.host);
  } catch {
    return false;
  }
});
const imageSrc = computed(() => optimizable.value
  && !failedOptimization.value
  ? $img(source.value, { width: props.width, format: "webp", quality: 70 })
  : source.value,
);
const imageSrcset = computed(() => {
  if (!optimizable.value || failedOptimization.value) return undefined;
  const smallWidth = Math.max(1, Math.round(props.width / 2));
  return `${$img(source.value, { width: smallWidth, format: "webp", quality: 70 })} ${smallWidth}w, ${imageSrc.value} ${props.width}w`;
});
</script>

<template>
  <img
    :src="imageSrc"
    :srcset="imageSrcset"
    :sizes="`${width / 2}px`"
    :alt="alt"
    :width="width"
    :height="height"
    loading="lazy"
    decoding="async"
    @error="failedOptimization = true"
  />
</template>
