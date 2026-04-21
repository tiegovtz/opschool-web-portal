<template>
  <div class="my-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <p v-if="spec.title" class="mb-2 text-center text-sm font-medium text-gray-700">{{ spec.title }}</p>
    <svg
      :viewBox="`0 0 ${spec.width || 320} ${spec.height || 240}`"
      class="w-full h-auto max-w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <template v-for="(shape, idx) in spec.shapes" :key="idx">
        <!-- Triangle / polygon -->
        <polygon
          v-if="(shape.type === 'triangle' || shape.type === 'polygon') && shape.points"
          :points="shape.points.map(p => p.join(',')).join(' ')"
          :stroke="shape.stroke || '#1d4ed8'"
          :fill="shape.fill || 'rgba(29,78,216,0.08)'"
          stroke-width="2"
        />
        <!-- Rect -->
        <rect
          v-else-if="shape.type === 'rect' && shape.points && shape.points.length >= 2"
          :x="Math.min(shape.points[0][0], shape.points[1][0])"
          :y="Math.min(shape.points[0][1], shape.points[1][1])"
          :width="Math.abs(shape.points[1][0] - shape.points[0][0])"
          :height="Math.abs(shape.points[1][1] - shape.points[0][1])"
          :stroke="shape.stroke || '#1d4ed8'"
          :fill="shape.fill || 'rgba(29,78,216,0.08)'"
          stroke-width="2"
        />
        <!-- Circle -->
        <circle
          v-else-if="shape.type === 'circle' && shape.center"
          :cx="shape.center[0]"
          :cy="shape.center[1]"
          :r="shape.radius || 40"
          :stroke="shape.stroke || '#1d4ed8'"
          :fill="shape.fill || 'rgba(29,78,216,0.08)'"
          stroke-width="2"
        />
        <!-- Line -->
        <line
          v-else-if="shape.type === 'line' && shape.points && shape.points.length >= 2"
          :x1="shape.points[0][0]"
          :y1="shape.points[0][1]"
          :x2="shape.points[1][0]"
          :y2="shape.points[1][1]"
          :stroke="shape.stroke || '#1d4ed8'"
          stroke-width="2"
        />
        <!-- Point -->
        <circle
          v-else-if="shape.type === 'point' && shape.points && shape.points[0]"
          :cx="shape.points[0][0]"
          :cy="shape.points[0][1]"
          r="3"
          :fill="shape.fill || '#111827'"
        />

        <!-- Right angle marker -->
        <polyline
          v-if="(shape.type === 'triangle' || shape.type === 'polygon') && shape.points && shape.rightAngleAt !== undefined && rightAngleMark(shape)"
          :points="rightAngleMark(shape)!"
          fill="none"
          stroke="#111827"
          stroke-width="1.5"
        />

        <!-- Vertex labels -->
        <template v-if="shape.points && shape.labels">
          <text
            v-for="(pt, i) in shape.points"
            :key="`lbl-${idx}-${i}`"
            :x="pt[0] + labelOffset(shape, i).dx"
            :y="pt[1] + labelOffset(shape, i).dy"
            class="select-none"
            font-size="13"
            font-family="sans-serif"
            fill="#111827"
          >{{ shape.labels[i] || '' }}</text>
        </template>

        <!-- Side labels -->
        <template v-if="shape.points && shape.sides && (shape.type === 'triangle' || shape.type === 'polygon')">
          <text
            v-for="(side, i) in shape.sides"
            :key="`side-${idx}-${i}`"
            :x="sideMid(shape, i).x"
            :y="sideMid(shape, i).y"
            text-anchor="middle"
            font-size="12"
            font-family="sans-serif"
            fill="#374151"
          >{{ side }}</text>
        </template>
      </template>
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Shape {
  type: string;
  points?: number[][];
  center?: number[];
  radius?: number;
  labels?: string[];
  sides?: string[];
  angle?: string;
  rightAngleAt?: number;
  stroke?: string;
  fill?: string;
}
interface Spec { width?: number; height?: number; title?: string; shapes: Shape[] }
const props = defineProps<{ spec: Spec }>();

const labelOffset = (shape: Shape, i: number) => {
  const pts = shape.points!;
  const p = pts[i]!;
  // push the label outward from the polygon centroid
  const cx = pts.reduce((s, q) => s + q[0]!, 0) / pts.length;
  const cy = pts.reduce((s, q) => s + q[1]!, 0) / pts.length;
  const vx = p[0]! - cx, vy = p[1]! - cy;
  const len = Math.hypot(vx, vy) || 1;
  return { dx: (vx / len) * 12 - 4, dy: (vy / len) * 12 + 4 };
};

const sideMid = (shape: Shape, i: number) => {
  const pts = shape.points!;
  const a = pts[i]!;
  const b = pts[(i + 1) % pts.length]!;
  const mx = (a[0]! + b[0]!) / 2;
  const my = (a[1]! + b[1]!) / 2;
  const cx = pts.reduce((s, q) => s + q[0]!, 0) / pts.length;
  const cy = pts.reduce((s, q) => s + q[1]!, 0) / pts.length;
  const vx = mx - cx, vy = my - cy;
  const len = Math.hypot(vx, vy) || 1;
  return { x: mx + (vx / len) * 10, y: my + (vy / len) * 10 };
};

const rightAngleMark = (shape: Shape): string | null => {
  const pts = shape.points!;
  const idx = shape.rightAngleAt!;
  const v = pts[idx]; if (!v) return null;
  const prev = pts[(idx - 1 + pts.length) % pts.length]!;
  const next = pts[(idx + 1) % pts.length]!;
  const size = 12;
  const ux = prev[0]! - v[0]!, uy = prev[1]! - v[1]!;
  const wx = next[0]! - v[0]!, wy = next[1]! - v[1]!;
  const ul = Math.hypot(ux, uy) || 1, wl = Math.hypot(wx, wy) || 1;
  const a = [v[0]! + (ux / ul) * size, v[1]! + (uy / ul) * size];
  const c = [v[0]! + (wx / wl) * size, v[1]! + (wy / wl) * size];
  const b = [a[0]! + (wx / wl) * size, a[1]! + (wy / wl) * size];
  return `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`;
};
</script>
