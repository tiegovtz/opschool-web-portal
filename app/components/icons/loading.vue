<script setup lang="ts">
defineProps({
    size: {
        type: Number,
        default: 12
    },
    color: {
        type: String,
        default: 'currentColor'
    }
})
</script>

<template>
    <svg :width="size" :height="size" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <circle cx="12" cy="2" r="0" :fill="color">
            <animate attributeName="r" begin="0" calcMode="spline" dur="1s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite"
                values="0;2;0;0" />
        </circle>
        <circle cx="12" cy="2" r="0" :fill="color" transform="rotate(45 12 12)">
            <animate attributeName="r" begin="0.125s" calcMode="spline" dur="1s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite"
                values="0;2;0;0" />
        </circle>
        <circle cx="12" cy="2" r="0" :fill="color" transform="rotate(90 12 12)">
            <animate attributeName="r" begin="0.25s" calcMode="spline" dur="1s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite"
                values="0;2;0;0" />
        </circle>
        <circle cx="12" cy="2" r="0" :fill="color" transform="rotate(135 12 12)">
            <animate attributeName="r" begin="0.375s" calcMode="spline" dur="1s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite"
                values="0;2;0;0" />
        </circle>
        <circle cx="12" cy="2" r="0" :fill="color" transform="rotate(180 12 12)">
            <animate attributeName="r" begin="0.5s" calcMode="spline" dur="1s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite"
                values="0;2;0;0" />
        </circle>
        <circle cx="12" cy="2" r="0" :fill="color" transform="rotate(225 12 12)">
            <animate attributeName="r" begin="0.625s" calcMode="spline" dur="1s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite"
                values="0;2;0;0" />
        </circle>
        <circle cx="12" cy="2" r="0" :fill="color" transform="rotate(270 12 12)">
            <animate attributeName="r" begin="0.75s" calcMode="spline" dur="1s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite"
                values="0;2;0;0" />
        </circle>
        <circle cx="12" cy="2" r="0" :fill="color" transform="rotate(315 12 12)">
            <animate attributeName="r" begin="0.875s" calcMode="spline" dur="1s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite"
                values="0;2;0;0" />
        </circle>
    </svg>

</template>