<script setup lang="ts">
defineProps<{
    chapters: any[],
    activeChapterId: string | null,
    activeSectionId?: string | null,
    sections?: { id: string; title: string }[]
}>()

// emit for color change and id sharing
const emit = defineEmits<{
    emitChapterId: [chapterId: string],
    emitSectionId: [sectionId: string]
}>()
</script>

<template>
    <div
        role="listitem"
        aria-label="activities list"
        class="flex max-h-[calc(100dvh-9rem)] flex-col gap-3 overflow-y-auto pr-1 md:pl-4 lg:max-h-none"
    >
        <div v-for="(chapter, index) in chapters" :key="chapter?._id"
            class="relative ml-3 flex flex-col gap-1 pl-5 before:absolute before:-left-3 before:top-6 before:w-8 before:border-t before:content-[''] after:content-['']"
            :class="[
                activeChapterId === chapter?._id ? 'before:border-oceanBlue' : 'before:border-gray-300',
                index < chapters.length - 1 ? 'after:absolute after:-bottom-9 after:-left-3 after:top-6 after:w-px after:bg-gray-300' : ''
            ]">
            <button type="button"
                :aria-label="`press to switch to ${chapter?.name}`"
                @click="emit('emitChapterId', chapter?._id)" :title="chapter?.name"
                class="flex items-center cursor-pointer border-b-2 bg-white p-3 text-left transition-colors hover:text-oceanBlue"
                :class="activeChapterId === chapter?._id
                    ? 'border-oceanBlue font-semibold text-oceanBlue'
                    : 'border-transparent text-slate-600'">
                <span class="line-clamp-2 text-start" :aria-label="`competence heading ${chapter?.name}`">
                    {{ chapter?.name }}
                </span>
            </button>
            <ul v-if="activeChapterId === chapter?._id && sections?.length"
                class="relative ml-4 flex flex-col gap-1 before:absolute before:-top-1 before:bottom-5 before:left-0 before:w-px before:bg-gray-300 before:content-['']">
                <li v-for="section in sections" :key="section.id"
                    class="relative pl-5 before:absolute before:left-0 before:top-1/2 before:w-4 before:border-t before:content-['']"
                    :class="activeSectionId === section.id ? 'before:border-oceanBlue' : 'before:border-gray-300'">
                    <button type="button" class="w-full border-b-2 px-0 py-2 text-left text-sm transition-colors hover:text-oceanBlue focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue"
                        :class="activeSectionId === section.id
                            ? 'border-oceanBlue font-semibold text-oceanBlue'
                            : 'border-transparent text-slate-600'"
                        :aria-current="activeSectionId === section.id ? 'location' : undefined"
                        :title="section.title" @click="emit('emitSectionId', section.id)">
                        {{ section.title }}
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>
