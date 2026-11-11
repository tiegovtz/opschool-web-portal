<script setup lang="ts">
defineProps<{
    chapters: { _id: string; name: string }[],
    activeChapterId: string | null,
    activeSectionId?: string | null,
    sections?: { id: string; title: string }[]
}>()

const emit = defineEmits<{
    emitChapterId: [chapterId: string],
    emitSectionId: [sectionId: string]
}>()

</script>

<template>
    <nav aria-label="Chapters and sections" class="max-h-[calc(100dvh-9rem)] overflow-y-auto pr-1 lg:max-h-none">
        <ul class="space-y-2">
            <li v-for="chapter in chapters" :key="chapter._id">
                <button type="button" :title="chapter.name"
                    class="flex w-full items-center gap-3 rounded-l-xl px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue"
                    :class="activeChapterId === chapter._id
                        ? 'bg-oceanBlue font-semibold text-white'
                        : 'text-slate-800 hover:bg-slate-50 hover:text-deepBlue'"
                    :aria-current="activeChapterId === chapter._id ? 'page' : undefined"
                    @click="emit('emitChapterId', chapter._id)">
                    <Icon :name="activeChapterId === chapter._id ? 'mdi:folder-open' : 'mdi:folder-outline'"
                        size="1.5rem" class="shrink-0" aria-hidden="true" />
                    <span class="min-w-0 flex-1 leading-snug">{{ chapter.name }}</span>
                </button>

                <ul v-if="activeChapterId === chapter._id && sections?.length"
                    class="ml-5 border-l-2 border-slate-200 pl-5 mt-2">
                    <li v-for="section in sections" :key="section.id"
                        class="relative before:absolute before:-left-4 before:top-5 before:w-4 before:border-t-2 before:border-slate-200 before:content-['']">
                        <button type="button" :title="section.title"
                            class="flex w-full items-center gap-3 rounded-l-lg px-2 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-oceanBlue"
                            :class="activeSectionId === section.id
                                ? 'bg-oceanBlue font-semibold text-white'
                                : 'text-slate-800 hover:bg-slate-50 hover:text-deepBlue'"
                            :aria-current="activeSectionId === section.id ? 'location' : undefined"
                            @click="emit('emitSectionId', section.id)">
                            <Icon name="mdi:folder-outline" size="1.3rem" class="shrink-0" aria-hidden="true" />
                            <span class="min-w-0 flex-1 leading-snug">{{ section.title }}</span>
                        </button>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>
</template>
