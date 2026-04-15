<script setup lang="ts">
type QuantityRendererProps = {
  count: number;
  image: string;
  alt?: string;
  summaryLabel?: string;
  className?: string;
  imageClassName?: string;
  maxItemsPerRow?: number;
  maxRows?: number;
};

const props = withDefaults(defineProps<QuantityRendererProps>(), {
  alt: "Item",
  className: "",
  imageClassName: "",
});
</script>

<template>
  <div
    role="img"
    :aria-label="props.summaryLabel || `${props.count} ${props.alt.toLowerCase()}${props.count === 1 ? '' : 's'}`"
    :class="`flex flex-wrap gap-1 md:max-w-[200px] xl:max-w-[350px] ${props.className}`"
  >
    <img
      v-for="i in props.count"
      :key="i"
      :src="props.image"
      alt=""
      aria-hidden="true"
      :class="`w-12 h-12 object-contain hover:scale-125 transition-transform ${props.imageClassName}`"
    />
  </div>
</template>
