<template>
  <div ref="wrapRef" class="relative h-full w-full pointer-events-none">
    <canvas ref="canvasRef" class="absolute inset-0 h-full w-full"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  active: boolean;
  audioLevel?: number;
}

const props = withDefaults(defineProps<Props>(), {
  audioLevel: 0,
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const wrapRef = ref<HTMLDivElement | null>(null);
let rafId: number | null = null;
let phase = 0;
let smoothLevel = 0;
let resizeObserver: ResizeObserver | null = null;

const syncCanvas = () => {
  const canvas = canvasRef.value;
  const wrap = wrapRef.value;
  if (!canvas || !wrap) return;
  const rect = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, rect.width * dpr);
  canvas.height = Math.max(1, rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
};

const drawLayer = (ctx: CanvasRenderingContext2D, opts: {
  amplitude: number;
  frequency: number;
  phase: number;
  baseline: number;
  color: string;
  glow: boolean;
}) => {
  const { width, height } = ctx.canvas;
  const w = width / (window.devicePixelRatio || 1);
  const h = height / (window.devicePixelRatio || 1);
  const mid = h * opts.baseline;
  const amp = opts.amplitude;
  const freq = opts.frequency;
  const gradient = ctx.createLinearGradient(0, mid + amp, 0, mid - amp * 1.2);
  gradient.addColorStop(0, opts.color);
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 6) {
    const y = mid + Math.sin(x * freq + opts.phase) * amp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  if (opts.glow) {
    ctx.shadowColor = 'rgba(59, 130, 246, 0.45)';
    ctx.shadowBlur = 24;
  }
  ctx.fill();
  ctx.restore();
};

const render = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  smoothLevel = smoothLevel * 0.85 + Math.min(1, props.audioLevel) * 0.15;
  const base = 18;
  const ampBoost = smoothLevel * 90;
  const amplitude = base + ampBoost;

  drawLayer(ctx, {
    amplitude: amplitude * 0.6,
    frequency: 0.012,
    phase: phase * 1.2,
    baseline: 0.78,
    color: 'rgba(59, 130, 246, 0.6)',
    glow: true,
  });
  drawLayer(ctx, {
    amplitude: amplitude * 0.9,
    frequency: 0.01,
    phase: phase * 0.9,
    baseline: 0.82,
    color: 'rgba(37, 99, 235, 0.5)',
    glow: false,
  });
  drawLayer(ctx, {
    amplitude: amplitude * 1.1,
    frequency: 0.008,
    phase: phase * 0.7,
    baseline: 0.86,
    color: 'rgba(59, 130, 246, 0.45)',
    glow: false,
  });
  drawLayer(ctx, {
    amplitude: amplitude * 0.75,
    frequency: 0.014,
    phase: phase * 1.4,
    baseline: 0.74,
    color: 'rgba(14, 165, 233, 0.35)',
    glow: false,
  });
};

const start = () => {
  if (rafId != null) return;
  const tick = () => {
    phase += 0.035 + smoothLevel * 0.08;
    render();
    rafId = requestAnimationFrame(tick);
  };
  tick();
};

const stop = () => {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  const canvas = canvasRef.value;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

defineExpose({ start, stop });

onMounted(() => {
  syncCanvas();
  if (wrapRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => syncCanvas());
    resizeObserver.observe(wrapRef.value);
  }
  if (props.active) start();
});

onUnmounted(() => {
  stop();
  if (resizeObserver && wrapRef.value) {
    resizeObserver.unobserve(wrapRef.value);
  }
  resizeObserver = null;
});

watch(
  () => props.active,
  (active) => {
    if (active) start();
    else stop();
  }
);
</script>
