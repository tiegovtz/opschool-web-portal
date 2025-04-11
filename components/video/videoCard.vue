<script setup>
import { layoutEffect } from "~/utilities/controlls";
const navigationStore = useNavigationStore()
const props = defineProps({
    videoId: {
        type: String,
        required: true,
    },
    videoName: {
        type: String,
        required: true,
    },
    videoThumbnail: {
        type: String,
        required: true,
    },
    videoFileUrl: {
        type: String,
        required: true,
    },
    videoDescription: {
        type: String,
        required: true,
    },
    videoType: {
        type: String,
        required: true,
    },
    videoLevel: {
        type: String,
        default: 'Secondary',
    },
    videoStandard: {
        type: String,
        default: 'Form One',
    },
    videoSubject: {
        type: String,
        default: 'Physics'
    },

    // progress
    topicProgress: {
        type: Number,
        default: 0,
    },
    topicViewed: Boolean

})

// Define Function
const setVideoToView = () => {
    navigationStore.setVideo(`/video/${props.videoStandard.toLowerCase()}/${props.videoSubject.toLowerCase()}/${props.videoName.toLowerCase()}/${props.videoId.toLowerCase()}`)
    useState('videoToView',
      () =>(
         {
            route:`/video/${props.videoStandard.toLowerCase()}/${props.videoSubject.toLowerCase()}/${props.videoName.toLowerCase()}/${props.videoId.toLowerCase()}`,
            updatedAt:Date.now()
        }
      ));
}
</script>

<template>
    <NuxtLink
        :to="`/video/${videoStandard.toLowerCase()}/${videoSubject.toLowerCase()}/${videoName.toLowerCase()}/${videoId.toLowerCase()}`" @click="setVideoToView()"
        :class="[
            'relative flex overflow-hidden transition-all duration-500 ease-in-out bg-white rounded-lg shadow-md cursor-pointer hover:bg-deepBlue hover:shadow-xl group',
            layoutEffect == 'grid' ? 'flex-col h-[350px]' : 'flex-row h-[100px]'
        ]">
        
        <!-- Thumbnail section -->
        <div :class="[
            'relative overflow-hidden transition-all duration-500 ease-in-out',
            layoutEffect == 'grid' ? 'h-[280px]' : 'h-full w-[200px]'
        ]">
            <NuxtImg :src="videoThumbnail" :alt="videoName.toLowerCase()"
                :class="[
                    'object-cover w-full h-full transition-transform duration-500',
                ]" />

                <div class="absolute inset-0 bg-gradient-to-t from-black bg-opacity-70 to-transparent opacity-70"></div>
            <!-- Play button -->
            <div
                class="absolute top-0 left-0 flex items-center justify-center w-full h-full transition-opacity cursor-pointer topitems-center opacity-90 group-hover:opacity-scale-100">
                <button
                    class="flex items-center justify-center p-3 transition-transform duration-300 border rounded-full cursor-pointer bg-white/20 backdrop-blur-sm border-white/30 group-hover:scale-110"
                    aria-label="Play video">
                    <Icon name="heroicons:play-solid" class="text-3xl text-white" />
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
                {{ videoName }}
            </h3>
            <p
                class="mb-4 text-sm text-gray-600 transition-colors duration-500 ease-in-out group-hover:text-white line-clamp-2">
                {{ videoDescription }}
            </p>

            <!-- Metadata footer -->
            <!-- <div
                class="flex items-center justify-end mt-auto text-xs text-gray-500 transition-colors duration-500 ease-in-out group-hover:text-white">
                <span class="flex items-center">
                    <Icon name="heroicons:eye" class="mr-1 text-sm" />
                    1.2k views
                </span>
            </div> -->
        </div>
    </NuxtLink>
</template>