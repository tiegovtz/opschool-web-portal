<template>
  <div :style="wrapperStyle">
    <div
      v-for="face in faces"
      :key="face"
      :style="getFaceStyle(face)"
    />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';

interface Props {
  size: number
  color: string
}

const props = defineProps<Props>()

const faces = ["front", "back", "right", "left", "top", "bottom"]

const wrapperStyle = computed<CSSProperties>(() => ({
  width: props.size + "px",
  height: props.size + "px",
  position: "relative",
  transform: "rotateX(-10deg) rotateY(-10deg)",
  transformStyle: "preserve-3d",
  margin: "8px",
}))

const getFaceStyle = (face: string):CSSProperties => {
  const s = props.size / 2

  const base = {
    position: "absolute",
    width: props.size + "px",
    height: props.size + "px",
    backgroundColor: props.color,
    border: "1px solid rgba(0,0,0,0.2)",
  }

  const transforms: Record<string, string> = {
    front: `translateZ(${s}px)`,
    back: `translateZ(-${s}px) rotateY(180deg)`,
    right: `rotateY(90deg) translateZ(${s}px)`,
    left: `rotateY(-90deg) translateZ(${s}px)`,
    top: `rotateX(90deg) translateZ(${s}px)`,
    bottom: `rotateX(-90deg) translateZ(${s}px)`,
  }

  return {
    ...base,
    transform: transforms[face],
    filter:
      face === "top"
        ? "brightness(1.2)"
        : face === "bottom"
        ? "brightness(0.5)"
        : face === "left" || face === "right"
        ? "brightness(0.7)"
        : "none",
  } as CSSProperties
}
</script>