<script setup>

defineProps({
    chapters:{
        type:Object,
        default: () => { {}}
    },
    activeChapterId:{
        type:String,
        required:true
    }
})

// emit for color change and id sharing
const emit = defineEmits(['emitChapterId'])
</script>

<template>
    <ul class="flex flex-col gap-3 pl-4">
        <li v-for="(chapter, index) in chapters" :key="index" @click="emit('emitChapterId',chapter?._id)"
            class="flex items-center gap-2 cursor-pointer p-3 rounded-md bg-containerGray"
            :class="{ 'bg-oceanBlue text-white': activeChapterId == chapter?._id }">
            <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
            {{ chapter?.name }}
        </li>
    </ul>
</template>