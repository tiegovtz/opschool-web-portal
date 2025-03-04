<template>
    <button @click="emit('sendPageNumber', pageNumber)" :disabled="disabled"
        :class="isActive ? 'bg-normalYellow text-white' : 'bg-gray-200 text-gray-500'"
        class="w-10 h-10 rounded-md shadow-sm cursor-pointer">
        {{ pageNumber }}
    </button>
</template>

<script setup>
 defineProps({
    pageNumber: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: false
    },
    disabled: {
        type: Boolean,
        required: true,
        default: false
    }
})
const emit = defineEmits(['sendPageNumber'])
</script>