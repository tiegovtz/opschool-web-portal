<script setup lang="ts">
import { layoutEffect } from "~/utilities/controlls";
import { useNavigationStore } from "~/stores/navigationStore";
const navigationStore = useNavigationStore()

const props = withDefaults( 
    defineProps<{
    experimentId:string|any,
    experimentName:string|any,
    experimentThumbnail?:string|any,
    experimentFileUrl: string|any,
    experimentDescription: string|any,
    experimentType: string|any,
    experimentLevel: string|any,
    experimentStandard?:string|any,
    experimentSubject: string |any,
    altText?:string
    // progress
    topicProgress?:number,
    topicViewed?: boolean

}>(),
{

    experimentThumbnail:'/images/background2.webp',
    topicProgress:0,
    experimentSubject:'Physics',
    experimentStandard:'Form One',
    experimentLevel:'Secondary',

})

// Define Set Experiment URL Function
const setExperimentUrl =()=>{
    navigationStore.setExperiment(`/experiments/${props.experimentStandard}/${props.experimentSubject}/${props.experimentName}/${props.experimentId}`);
    useState('experimentToView', () => (
           {
            route:`/experiments/${props.experimentStandard}/${props.experimentSubject}/${props.experimentName}/${props.experimentId}`,
            updatedAt:Date.now()
        })
    );
}
</script>

<template>
    <NuxtLink
        :to="`/experiments/${experimentStandard}/${experimentSubject}/${experimentName}/${experimentId}`" 
        @click="setExperimentUrl()"
        :aria-label="`View ${experimentName} experiment with experiment description ${experimentDescription}`"
        :class="[
            'relative flex overflow-hidden transition-all duration-500 ease-in-out bg-white rounded-lg shadow-md cursor-pointer hover:bg-deepBlue hover:shadow-xl group min-w-[300px]',
            layoutEffect == 'grid' ? 'flex-col h-[350px]' : 'flex-row h-32'
        ]"
        >
        <!-- Thumbnail section -->
        <div :class="[
            'relative overflow-hidden transition-all duration-500 ease-in-out',
            layoutEffect == 'grid' ? 'h-[280px]' : 'h-full w-full max-w-[200px]'
        ]">
            <NuxtImg :src="experimentThumbnail" :alt="altText??experimentName"
                class="object-cover w-full h-full transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-black bg-opacity-70 to-transparent opacity-70" aria-hidden="true"></div>

            <!-- Play button -->
            <div
                class="absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer opacity-90 group-hover:opacity-100">
                <button
                    class="flex items-center justify-center p-3 transition-transform duration-300 border rounded-full cursor-pointer bg-white/20 backdrop-blur-sm border-white/30 group-hover:scale-110"
                    :aria-label="`Play ${experimentName} experiment`"
                    type="button">
                    <Icon name="icon-park-solid:experiment-one" class="text-3xl text-white" aria-hidden="true" />
                </button>
            </div>
        </div>

        <!-- Content section -->
        <div class="flex flex-col flex-grow p-4">
            <p
                class="mb-4 text-sm text-gray-600 transition-colors duration-500 ease-in-out group-hover:text-white line-clamp-2">
                {{ experimentName }}
            </p>
            <p
                class="mb-4 text-sm text-gray-600 transition-colors duration-500 ease-in-out group-hover:text-white line-clamp-2">
                {{ experimentDescription }}
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
