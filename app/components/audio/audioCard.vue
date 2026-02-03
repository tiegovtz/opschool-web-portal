<script setup lang="ts">
import { layoutEffect } from "~/utilities/controlls";
import { useNavigationStore } from "~/stores/navigationStore";

const navigationStore = useNavigationStore()

const props = withDefaults(
    defineProps<{
        audioId: string
        audioName: string
        audioThumbnail?: string
        audioFileUrl: string
        audioDescription: string
        audioType?: string
        audioLevel?: string
        audioStandard?: string
        audioSubject?: string
        topicProgress?: number
        topicViewed?: boolean
        isDeleted?: boolean
        altText?:string
    }>(),
    {
        audioThumbnail: '/images/default.webp',
        audioType: 'lecture',
        audioLevel: 'Secondary',
        audioStandard: 'Form One',
        audioSubject: 'Physics',
        topicProgress: 0,
        topicViewed: false,
        isDeleted: false,
    }
)

// Define Function
const setAudioToListen = () => {
    navigationStore.setAudio(`/audio/${props.audioStandard}/${props.audioSubject}/${props.audioName}/${props.audioId}`)
    useState('audioToView',
        () => (
            {
                route: `/audio/${props.audioStandard}/${props.audioSubject}/${props.audioName}/${props.audioId}`,
                updatedAt: Date.now()
            }
        ));
}
</script>

<template>
    <NuxtLink v-if="!isDeleted" :to="`/audio/${audioStandard}/${audioSubject}/${audioName}/${audioId}`"
        @click="setAudioToListen()" :class="[
            'relative flex overflow-hidden transition-all duration-500 ease-in-out bg-white rounded-lg shadow-md cursor-pointer hover:bg-deepBlue hover:shadow-xl group min-w-[300px]',
            layoutEffect == 'grid' ? 'flex-col h-[350px]' : 'flex-row h-32'
        ]">

        <!-- Thumbnail section -->
        <div :class="[
            'relative overflow-hidden transition-all duration-500 ease-in-out',
            layoutEffect == 'grid' ? 'aspect-video' : 'h-full w-full max-w-[200px]'
        ]">
            <NuxtImg :src="audioThumbnail" tabindex="0" :alt="audioName.toLowerCase()" :class="[
                'object-cover w-full h-full transition-transform duration-500',
            ]" />

            <div class="absolute inset-0 bg-gradient-to-t from-black bg-opacity-70 to-transparent opacity-70"></div>
            <!-- Play button -->
            <div
                class="absolute top-0 left-0 flex items-center justify-center w-full h-full transition-opacity cursor-pointer topitems-center opacity-90 group-hover:opacity-scale-100">
                <button
                    class="flex items-center justify-center p-3 transition-transform duration-300 border rounded-full cursor-pointer bg-white/20 backdrop-blur-sm border-white/30 group-hover:scale-110"
                    aria-label="Play audio">
                    <Icon name="gridicons:audio" class="text-3xl text-white" />
                </button>
            </div>
        </div>
        <!-- Content section -->
        <div :class="[
            'flex flex-col',
            layoutEffect == 'grid' ? 'p-4' : 'px-2'
        ]">
            <h3
                class="mb-2 text-lg font-semibold capitalize transition-colors duration-500 ease-in-out group-hover:text-white">
                {{ audioName }}
            </h3>
            <p
                class="mb-4 text-sm text-gray-600 transition-colors duration-500 ease-in-out group-hover:text-white line-clamp-2">
                {{ audioDescription }}
            </p>
        </div>
    </NuxtLink>
</template>
