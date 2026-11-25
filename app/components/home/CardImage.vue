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
const optimizationAttempt = ref(0);
const failedSource = ref(false);
const source = computed(() => {
  if (failedSource.value) return "/images/default.webp";
  const value = props.src?.trim() || "/images/default.webp";
  return value.startsWith("/public/") ? value.slice("/public".length) : value;
});
watch(() => props.src, () => {
  optimizationAttempt.value = 0;
  failedSource.value = false;
});
const handleImageError = () => {
  if (optimizedSource.value) {
    optimizationAttempt.value++;
  } else if (source.value !== "/images/default.webp") {
    failedSource.value = true;
    optimizationAttempt.value = 0;
  }
};
const isOptimizable = (value: string) => {
  if (/\.(?:gif|svg)(?:[?#]|$)/i.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && $img.options.domains.includes(url.host);
  } catch {
    return false;
  }
};
const optimizationSources = computed(() => {
  // Try the stored public URL first. An internal origin can depend on proxy
  // virtual-host routing, so use it only if fetching the public image fails.
  const sources = [source.value];
  const origin = String(config.public.imageFetchOrigin || "").trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(source.value);
    if (origin && ["http:", "https:"].includes(parsed.protocol)) {
      sources.push(`${origin}${parsed.pathname}${parsed.search}${parsed.hash}`);
    }
  } catch {
    // Local assets need no alternate fetch origin.
  }
  return [...new Set(sources)].filter(isOptimizable);
});
const optimizedSource = computed(() => optimizationSources.value[optimizationAttempt.value]);
const imageSrc = computed(() => optimizedSource.value
  ? $img(optimizedSource.value, { width: props.width, format: "webp", quality: 70 })
  : source.value,
);
const imageSrcset = computed(() => {
  if (!optimizedSource.value) return undefined;
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
    @error="handleImageError"
  />
</template>
