<script setup lang="ts">
import { layoutEffect } from "~/utilities/controlls";
import { useNavigationStore } from "~/stores/navigationStore";
const navigationStore = useNavigationStore()
const props = withDefaults( defineProps<{
    videoId: string|any,
    videoName: string|any,
    videoThumbnail?: string|any,
    videoFileUrl: string|any,
    videoDescription:string|any,
    videoType:string|any,
    videoLevel: string|any,
    videoStandard: string|any,
    videoSubject: string|any,
    altText?:string|any

    // progress
    topicProgress: number,
    topicViewed: boolean,
    isDeleted:boolean

}>(),{
    videoThumbnail:'/public/images/default.webp',
    videoLevel:'Secondary',
    videoStandard:'Form One',
    videoSubject: 'Physics',
    topicProgress:0,
    isDeleted: false,

})

// Define Function
const setVideoToView = () => {
    navigationStore.setVideo(`/video/${props.videoStandard}/${props.videoSubject}/${props.videoName}/${props.videoId}`)
    useState('videoToView',
      () =>(
         {
            route:`/video/${props.videoStandard}/${props.videoSubject}/${props.videoName}/${props.videoId}`,
            updatedAt:Date.now()
        }
      ));
}
</script>

<template>
    <NuxtLink 
        v-if="!isDeleted"
        :to="`/video/${videoStandard}/${videoSubject}/${videoName}/${videoId}`" @click="setVideoToView()"
        :class="[
            'relative flex overflow-hidden transition-all duration-500 ease-in-out bg-white rounded-lg shadow-md cursor-pointer hover:bg-deepBlue hover:shadow-xl group min-w-[300px]',
            layoutEffect == 'grid' ? 'flex-col h-[350px]' : 'flex-row h-32',
            
        ]" 
        :aria-label="`View ${videoName} video with video description ${videoDescription}`"
        >
        
        <!-- Thumbnail section -->
        <div :class="[
            'relative overflow-hidden transition-all duration-500 ease-in-out',
            layoutEffect == 'grid' ? 'aspect-video' : 'h-full w-full max-w-[200px]'
        ]">
            <NuxtImg :src="videoThumbnail" tabindex="0" :alt="altText ?? videoName.toLowerCase()"
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
