<template>
    <div class="w-full flex flex-col items-center justify-center gap-4">
        <!-- Icon -->
        <Icon name="fluent:warning-20-regular" size="50" class="text-red-500" />

        <!-- Main Message -->
        <p class="text-medium font-medium text-textGray text-center">
            {{ message }}
        </p>

        <!-- Sub Message -->
        <p class="text-base text-gray-500 text-center" v-html="subMessage"></p>

        <!-- Suggested Action -->
        <div class="mt-4">
            <NuxtLink to="/" class="text-oceanBlue font-semibold hover:text-oceanBlue/40">
                Go to Home
            </NuxtLink>
        </div>
    </div>
</template>

<script setup>
// You can use any icon library. In this case, `fluent:warning-20-regular` is used.
 defineProps({
    message: {
        type: String,
        default: 'Oops! The page you are looking for doesn\'t exist. 😞'
    },
    subMessage: {
        type: String,
        default: 'It seems like the page might have been moved or doesn\'t exist anymore. <br /> But don\'t worry, we\'ll get you back on track!',
    }
})
</script>

