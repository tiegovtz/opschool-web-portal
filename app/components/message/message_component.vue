<script setup>

defineProps({
    message: {
        type: String,
        default:'',
    },
    icon: {
        type: String,
        default: "icons8:checked",
    },
    eventType: {
        type: String,
        default: "succes"
    },
    position: {
        type: Boolean,
        default: false,
    }
})

</script>

<template>
    <div :class="position ? 'top-10' : '-top-32 opacity-0'"
        class="fixed z-40 flex items-center justify-center w-auto max-w-md gap-3 px-4 py-3 transition-all duration-500 ease-in-out bg-white rounded-lg shadow-md md:w-full">
        <div v-if="message" class="flex items-center">
            <Icon :name="icon" :class="eventType == 'success' ? 'text-green-500' : 'text-red-500'"
            size="20" />
        </div>
        <p>{{ message }}</p>
    </div>
</template>