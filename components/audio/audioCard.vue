<script setup>
import { layoutEffect } from "~/utilities/controlls";
const navigationStore = useNavigationStore()
const props = defineProps({
    audioId: {
        type: String,
        required: true,
    },
    audioName: {
        type: String,
        required: true,
    },
    audioThumbnail: {
        type: String,
       default: '/public/images/default.webp',
    },
    audioFileUrl: {
        type: String,
        required: true,
    },
    audioDescription: {
        type: String,
        required: true,
    },
    audioType: {
        type: String,
        default: 'lecture',
    },
    audioLevel: {
        type: String,
        default: 'Secondary',
    },
    audioStandard: {
        type: String,
        default: 'Form One',
    },
    audioSubject: {
        type: String,
        default: 'Physics'
    },

    // progress
    topicProgress: {
        type: Number,
        default: 0,
    },
    topicViewed: Boolean,
    isDeleted:{
        type: Boolean,
        default: false,
    }

})

// Define Function
const setAudioToListen = () => {
    navigationStore.setAudio(`/audio/${props.audioStandard}/${props.audioSubject}/${props.audioName}/${props.audioId}`)
    useState('audioToView',
      () =>(
         {
            route:`/audio/${props.audioStandard}/${props.audioSubject}/${props.audioName}/${props.audioId}`,
            updatedAt:Date.now()
        }
      ));
}
</script>

<template>
    <NuxtLink 
        v-if="!isDeleted"
        :to="`/audio/${audioStandard}/${audioSubject}/${audioName}/${audioId}`" @click="setAudioToListen()"
        :class="[
            'relative flex overflow-hidden transition-all duration-500 ease-in-out bg-white rounded-lg shadow-md cursor-pointer hover:bg-deepBlue hover:shadow-xl group min-w-[300px]',
            layoutEffect == 'grid' ? 'flex-col h-[350px]' : 'flex-row h-32'
        ]">
        
        <!-- Thumbnail section -->
        <div :class="[
            'relative overflow-hidden transition-all duration-500 ease-in-out',
            layoutEffect == 'grid' ? 'h-[280px]' : 'h-full w-full max-w-[200px]'
        ]">
            <NuxtImg :src="audioThumbnail" :alt="audioName.toLowerCase()"
                :class="[
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