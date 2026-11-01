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
const config = useRuntimeConfig();
const failedOptimization = ref(false);
const source = computed(() => {
  const value = props.src?.trim() || "/images/default.webp";
  return value.startsWith("/public/") ? value.slice("/public".length) : value;
});
watch(source, () => { failedOptimization.value = false; });
const optimizedSource = computed(() => {
  // IPX runs inside Docker, where the public IP times out; the gateway is reachable.
  const origin = config.public.imageFetchOrigin?.trim().replace(/\/+$/, "");
  const publicUploads = "http://41.59.251.166/api/uploads/";
  return origin && source.value.startsWith(publicUploads)
    ? `${origin}/api/uploads/${source.value.slice(publicUploads.length)}`
    : source.value;
});
const optimizable = computed(() => {
  if (/\.(?:gif|svg)(?:[?#]|$)/i.test(optimizedSource.value)) return false;
  if (optimizedSource.value.startsWith("/") && !optimizedSource.value.startsWith("//")) return true;
  try {
    const url = new URL(optimizedSource.value);
    return ["http:", "https:"].includes(url.protocol) && $img.options.domains.includes(url.host);
  } catch {
    return false;
  }
});
const imageSrc = computed(() => optimizable.value
  && !failedOptimization.value
  ? $img(optimizedSource.value, { width: props.width, format: "webp", quality: 70 })
  : source.value,
);
const imageSrcset = computed(() => {
  if (!optimizable.value || failedOptimization.value) return undefined;
  const smallWidth = Math.max(1, Math.round(props.width / 2));
  return `${$img(optimizedSource.value, { width: smallWidth, format: "webp", quality: 70 })} ${smallWidth}w, ${imageSrc.value} ${props.width}w`;
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
