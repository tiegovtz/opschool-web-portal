<script setup lang="ts">
const props = withDefaults(defineProps<{
    label?: string
    ariaLabel?: string
    ariaDescribedby?: string
}>(), {
    label: 'click me',
    ariaLabel: undefined,
    ariaDescribedby: undefined,
});

const emit = defineEmits<{
    click: [event: MouseEvent]
}>();
</script>

<template>
    <button type="button" class="tie-cta-button cursor-pointer relative inline-flex items-center overflow-hidden border-none rounded-full py-4 px-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue focus-visible:ring-4 focus-visible:ring-oceanBlue/30 focus-visible:ring-offset-4 focus-visible:ring-offset-white"
        :aria-label="props.ariaLabel ?? props.label" :aria-describedby="props.ariaDescribedby" @click="emit('click', $event)">
        <span class="tie-cta-fold" aria-hidden="true" />
        <span class="tie-cta-points" aria-hidden="true">
             <span v-for="(_,index) in Array.from({ length: 10 })" :key="`${index}-${props.label.toLowerCase().split('').join('-')}`" class="tie-cta-point" />
        </span>
        <span class="tie-cta-inner">{{ props.label }}</span>
    </button>
</template>

<style scoped lang="css">

.tie-cta-button {
  background:
    radial-gradient(70% 80% at 50% 100%, rgba(122, 201, 255, 0.45) 0%, rgba(122, 201, 255, 0) 100%),
    linear-gradient(135deg, #3e87c5 0%, #1f6fb2 45%, #174f80 100%);
  box-shadow: 0px 14px 28px rgba(31, 111, 178, 0.34);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.tie-cta-button::before,
.tie-cta-button::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  transition: all 0.5s ease-in-out;
}

.tie-cta-button::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.02) 100%);
}

.tie-cta-button::after {
  inset: 2px;
  background:
    radial-gradient(65% 70% at 50% 100%, rgba(131, 210, 255, 0.32) 0%, rgba(131, 210, 255, 0) 100%),
    linear-gradient(135deg, #3e87c5 0%, #1f6fb2 45%, #174f80 100%);
}

.tie-cta-button:hover {
  transform: translateY(-4px);
  box-shadow: 0px 18px 34px rgba(31, 111, 178, 0.42);
}

.tie-cta-button:active {
  transform: scale(0.95);
}

.tie-cta-fold {
  z-index: 1;
  position: absolute;
  top: 0;
  right: 0;
  height: 1rem;
  width: 1rem;
  display: inline-block;
  transition: all 0.45s ease-in-out;
  background: radial-gradient(100% 75% at 55%, rgba(123, 207, 255, 0.78) 0%, rgba(123, 207, 255, 0) 100%);
  box-shadow: 0 0 10px rgba(8, 46, 78, 0.18);
  border-bottom-left-radius: 0.5rem;
  border-top-right-radius: 9999px;
}

.tie-cta-fold::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 150%;
  height: 150%;
  transform: rotate(45deg) translateX(0%) translateY(-18px);
  background: rgba(240, 250, 255, 0.95);
  pointer-events: none;
}

.tie-cta-button:hover .tie-cta-fold {
  margin-top: -1rem;
  margin-right: -1rem;
}

.tie-cta-points {
  overflow: hidden;
  width: 100%;
  height: 100%;
  pointer-events: none;
  position: absolute;
  z-index: 1;
  opacity: 1;
}

.tie-cta-point {
  bottom: -10px;
  position: absolute;
  animation: tie-floating-points infinite ease-in-out;
  pointer-events: none;
  width: 3px;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.96);
  border-radius: 9999px;
  box-shadow: 0 0 10px rgba(189, 233, 255, 0.85);
}

@keyframes tie-floating-points {
  0% {
    transform: translateY(0);
  }

  85% {
    opacity: 0;
  }

  100% {
    transform: translateY(-68px) scale(1.15);
    opacity: 0;
  }
}

.tie-cta-point:nth-child(1) {
  left: 10%;
  opacity: 1;
  animation-duration: 2.35s;
  animation-delay: 0.2s;
}

.tie-cta-point:nth-child(2) {
  left: 30%;
  opacity: 0.7;
  animation-duration: 2.5s;
  animation-delay: 0.5s;
}

.tie-cta-point:nth-child(3) {
  left: 25%;
  opacity: 0.8;
  animation-duration: 2.2s;
  animation-delay: 0.1s;
}

.tie-cta-point:nth-child(4) {
  left: 44%;
  opacity: 0.6;
  animation-duration: 2.05s;
}

.tie-cta-point:nth-child(5) {
  left: 50%;
  opacity: 1;
  animation-duration: 1.9s;
}

.tie-cta-point:nth-child(6) {
  left: 75%;
  opacity: 0.5;
  animation-duration: 1.5s;
  animation-delay: 1.5s;
}

.tie-cta-point:nth-child(7) {
  left: 88%;
  opacity: 0.9;
  animation-duration: 2.2s;
  animation-delay: 0.2s;
}

.tie-cta-point:nth-child(8) {
  left: 58%;
  opacity: 0.8;
  animation-duration: 2.25s;
  animation-delay: 0.2s;
}

.tie-cta-point:nth-child(9) {
  left: 98%;
  opacity: 0.6;
  animation-duration: 2.6s;
  animation-delay: 0.1s;
}

.tie-cta-point:nth-child(10) {
  left: 65%;
  opacity: 1;
  animation-duration: 2.5s;
  animation-delay: 0.2s;
}

.tie-cta-button:hover .tie-cta-point {
  animation-duration: 1.55s;
}

.tie-cta-inner {
  z-index: 2;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: -0.01em;
}

</style>
