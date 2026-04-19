/**
 * Auto-scroll while an HTML5 drag is active: when the pointer sits near the edge of a scrollable
 * region (nested overflow container or the window), scroll so drop targets off-screen can be reached.
 */

const EDGE_PX = 72;
const MAX_STEP_X = 28;
/** Slightly higher so list / page vertical auto-scroll while dragging feels a bit snappier. */
const MAX_STEP_Y = 34;

let rafId: number | null = null;
let active = false;
let lastX = 0;
let lastY = 0;

function clampStep(distIntoEdge: number, maxStep: number): number {
  if (distIntoEdge <= 0) return 0;
  const t = Math.min(1, distIntoEdge / EDGE_PX);
  return Math.max(1, Math.ceil(t * maxStep));
}

/**
 * Scroll the innermost scrollable ancestor whose edge the pointer is near; otherwise scroll the window.
 */
function scrollFromPoint(clientX: number, clientY: number): void {
  let el: Element | null = null;
  try {
    el = document.elementFromPoint(clientX, clientY);
  } catch {
    el = null;
  }
  if (!el) {
    scrollWindow(clientX, clientY);
    return;
  }

  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const st = window.getComputedStyle(node);
    const oy = st.overflowY;
    const ox = st.overflowX;
    const canY =
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      node.scrollHeight > node.clientHeight + 1;
    const canX =
      (ox === "auto" || ox === "scroll" || ox === "overlay") &&
      node.scrollWidth > node.clientWidth + 1;
    const r = node.getBoundingClientRect();

    if (canY) {
      const distTop = clientY - r.top;
      const distBottom = r.bottom - clientY;
      if (distTop < EDGE_PX && node.scrollTop > 0) {
        node.scrollTop -= clampStep(EDGE_PX - distTop, MAX_STEP_Y);
        return;
      }
      if (distBottom < EDGE_PX && node.scrollTop < node.scrollHeight - node.clientHeight - 1) {
        node.scrollTop += clampStep(EDGE_PX - distBottom, MAX_STEP_Y);
        return;
      }
    }
    if (canX) {
      const distLeft = clientX - r.left;
      const distRight = r.right - clientX;
      if (distLeft < EDGE_PX && node.scrollLeft > 0) {
        node.scrollLeft -= clampStep(EDGE_PX - distLeft, MAX_STEP_X);
        return;
      }
      if (distRight < EDGE_PX && node.scrollLeft < node.scrollWidth - node.clientWidth - 1) {
        node.scrollLeft += clampStep(EDGE_PX - distRight, MAX_STEP_X);
        return;
      }
    }
    node = node.parentElement;
  }

  scrollWindow(clientX, clientY);
}

export function applyDragAutoScrollAt(clientX: number, clientY: number): void {
  scrollFromPoint(clientX, clientY);
}

function scrollWindow(clientX: number, clientY: number): void {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let dx = 0;
  let dy = 0;

  if (clientY < EDGE_PX) {
    dy = -clampStep(EDGE_PX - clientY, MAX_STEP_Y);
  } else if (clientY > vh - EDGE_PX) {
    dy = clampStep(clientY - (vh - EDGE_PX), MAX_STEP_Y);
  }

  if (clientX < EDGE_PX) {
    dx = -clampStep(EDGE_PX - clientX, MAX_STEP_X);
  } else if (clientX > vw - EDGE_PX) {
    dx = clampStep(clientX - (vw - EDGE_PX), MAX_STEP_X);
  }

  if (dx !== 0 || dy !== 0) {
    window.scrollBy({ left: dx, top: dy, behavior: "auto" });
  }
}

function onDragEvent(e: DragEvent): void {
  lastX = e.clientX;
  lastY = e.clientY;
}

function tick(): void {
  if (!active) return;
  scrollFromPoint(lastX, lastY);
  rafId = requestAnimationFrame(tick);
}

export function startDragAutoScroll(): void {
  if (active) return;
  active = true;
  lastX = window.innerWidth / 2;
  lastY = window.innerHeight / 2;
  window.addEventListener("drag", onDragEvent, true);
  window.addEventListener("dragover", onDragEvent, true);
  rafId = requestAnimationFrame(tick);
}

export function stopDragAutoScroll(): void {
  if (!active) return;
  active = false;
  window.removeEventListener("drag", onDragEvent, true);
  window.removeEventListener("dragover", onDragEvent, true);
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
