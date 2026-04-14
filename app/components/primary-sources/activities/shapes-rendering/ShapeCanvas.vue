<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { SegmentedShape, Shape2D, Shape3D, ShapeQuestion } from "./types";
import {
  draw2DShape,
  draw3DShape,
  drawPolygon,
  drawSegmentedShape,
} from "./drawing-utils";

type ShapeCanvasProps = {
  question: ShapeQuestion;
  canvasIndex: number;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
};

const props = withDefaults(defineProps<ShapeCanvasProps>(), {
  width: 200,
  height: 200,
  className: "",
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

const paint = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = props.width;
  const height = props.height;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  const shape = props.question.shape;
  if (shape.type === "polygon") {
    drawPolygon(ctx, shape, width, height);
  } else if (shape.type.startsWith("segmented")) {
    drawSegmentedShape(ctx, shape as SegmentedShape, width, height);
  } else if (
    [
      "circle",
      "triangle",
      "square",
      "rectangle",
      "pentagon",
      "hexagon",
      "star",
      "oval",
    ].includes(shape.type)
  ) {
    draw2DShape(ctx, shape as Shape2D, width, height);
  } else {
    draw3DShape(ctx, shape as Shape3D, width, height);
  }
};

onMounted(paint);
watch(
  () => [props.question, props.width, props.height],
  paint,
  { deep: true },
);
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="props.width"
    :height="props.height"
    :class="props.className"
    role="img"
    :aria-label="props.ariaLabel || `Shape ${props.canvasIndex + 1}`"
  />
</template>
