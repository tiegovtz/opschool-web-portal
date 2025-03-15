<script setup>
import { isPopUp, popMessage } from "~/utilities/controlls";
</script>

<template>
    <div class="fixed -z-50 flex items-center justify-center min-h-dvh w-dvw bg-black/40 backdrop-blur-lg transition-all duration-500 ease-linear"
        :class="{'z-10' : isPopUp}">
        <div class="bg-white rounded-md shadow-lg p-4 flex items-center gap-2 max-w-[500px]">
            <p>{{ popMessage }}</p>
            <div
                class="flex items-center justify-center mb-20 cursor-pointer  h-8 w-8 rounded-full hover:inset-shadow-sm hover:inset-shadow-gray-500/40 p-1 transition-all duration-500 ease-in-out" 
                 @click="isPopUp = !isPopUp"
                >
                <Icon name="iconoir:cancel" size="20" class="text-red-500" />
            </div>
        </div>
    </div>
</template>