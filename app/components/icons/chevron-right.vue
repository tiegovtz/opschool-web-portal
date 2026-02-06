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
        <path :fill="color" d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6z" />
    </svg>

</template>