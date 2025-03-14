<script setup>

defineProps({
    message: {
        type: String,
        required: true,
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
    <div :class="position ? 'top-10' : '-top-30 opacity-0'"
        class="fixed flex items-center justify-center md:w-full w-auto max-w-md px-4 py-3 gap-3 bg-white rounded-lg shadow-md transition-all duration-500 ease-in-out">
        <Icon :name="icon" class="cursor-pointer" :class="eventType == 'succes' ? 'text-green-500' : 'text-red-500'"
            size="20" />
        <p>{{ message }}</p>
    </div>
</template>