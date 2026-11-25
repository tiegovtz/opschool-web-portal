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
const failedSource = ref(false);
const source = computed(() => {
  if (failedSource.value) return "/images/default.webp";
  const value = props.src?.trim() || "/images/default.webp";
  return value.startsWith("/public/") ? value.slice("/public".length) : value;
});
watch(() => props.src, () => {
  failedOptimization.value = false;
  failedSource.value = false;
});
const handleImageError = () => {
  if (optimizable.value && !failedOptimization.value) {
    failedOptimization.value = true;
  } else if (source.value !== "/images/default.webp") {
    failedSource.value = true;
  }
};
const optimizedSource = computed(() => {
  // The stored src is a public, browser-facing URL (whatever domain/IP the
  // deployment currently answers on). The image optimizer runs *inside* this
  // same Node server, which usually cannot dial back out to its own public
  // address (hairpin NAT), so swap the origin for a server-reachable one
  // when this is an absolute URL, keeping the rest of the URL untouched.
  const origin = String(config.public.imageFetchOrigin || "").trim().replace(/\/+$/, "");
  if (!origin) return source.value;
  try {
    const parsed = new URL(source.value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return source.value;
    return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return source.value;
  }
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
    @error="handleImageError"
  />
</template>
