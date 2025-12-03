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
    <div role="listitem" aria-label="activities list" class="flex flex-col gap-3 md:pl-4">
        <button type="button" v-for="(chapter, index) in chapters" :key="index" :aria-label="`press to switch to ${chapter?.name}`" tabindex="0" @click="emit('emitChapterId',chapter?._id)"
            :title="chapter?.name"
            class="flex items-center gap-2 cursor-pointer p-3 rounded-md bg-containerGray"
            :class="{ 'bg-oceanBlue text-white shadow-oceanBlue/50 shadow-md': activeChapterId == chapter?._id }">
            <div class="">
                <Icon aria-label="folder icon," name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
            </div>
            <div  class="line-clamp-2 text-start" :aria-label="`compitence heading ${chapter?.name}`" role="heading" >
                {{ chapter?.name }}
            </div>
        </button>
    </div>
</template>