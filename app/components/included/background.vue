<script setup lang="ts">
const svgPaths = {
  p17964000:
    "M468.76 452.042C468.76 721.556 870.301 975.999 574.557 975.999C278.812 975.999 0 536.63 0 267.116C0 -2.3988 208.338 0.000734426 574.557 0.000734426C870.301 0.000734426 468.76 182.527 468.76 452.042Z",
};
</script>

<template>
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -left-24 top-1/2 -translate-y-1/2 h-[900px] w-[600px] rotate-[175deg] opacity-35">
            <svg class="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 683.242 975.999">
                <path :d="svgPaths.p17964000" fill="url(#paint0_linear_1_51)" fill-opacity="0.5" />
                <defs>
                    <linearGradient id="paint0_linear_1_51" gradientUnits="userSpaceOnUse" x1="186.179" x2="407.128"
                        y1="-160.148" y2="978.694">
                        <stop offset="0.00713105" stop-color="#287EC1" stop-opacity="0.5" />
                        <stop offset="1" stop-color="#B53AC4" stop-opacity="0.5" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
        <div class="absolute inset-y-0 left-[10%] w-[24rem] rotate-[36deg] bg-[rgba(31,111,178,0.18)]" />
        <div class="absolute -right-32 top-20 h-96 w-96 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />
        <div
            class="absolute bottom-[-10rem] left-[-6rem] h-80 w-80 rounded-full bg-[rgba(255,255,255,0.12)] blur-2xl" />
    </div>
</template>