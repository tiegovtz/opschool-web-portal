<script setup>
 defineProps({
    message:{
        type:String,
         default:'This activitiy will be updated soon'
    }
 })
</script>

<template>
    <div class="w-full flex flex-col items-center justify-center gap-2">
        <Icon name="uiw:information-o" size="30" class="text-oceanBlue" />
        <p class="text-medium font-medium text-textGray text-center">
            We're working hard to bring you the best content!
        </p>
        <p class="text-base text-gray-500 text-center">
            {{ message }} — stay tuned for new
            and
            exciting learning materials. 😊📚
        </p>
    </div>
</template>