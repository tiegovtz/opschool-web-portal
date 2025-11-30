<script setup>
import { layoutEffect } from "~/utilities/controlls";
const navigationStore = useNavigationStore()

const props = defineProps({
    experimentId: {
        type: String,
        required: true,
    },
    experimentName: {
        type: String,
        required: true,
    },
    experimentThumbnail: {
        type: String,
    default: '/images/background2.webp',
    },
    experimentFileUrl: {
        type: String,
        required: true,
    },
    experimentDescription: {
        type: String,
        required: true,
    },
    experimentType: {
        type: String,
        required: true,
    },
    experimentLevel: {
        type: String,
        default: 'Secondary',
    },
    experimentStandard: {
        type: String,
        default: 'Form One',
    },
    experimentSubject: {
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
        :aria-label="`View ${experimentName} experiment`"
        :class="[
            'relative flex overflow-hidden transition-all duration-500 ease-in-out bg-white rounded-lg shadow-md cursor-pointer hover:bg-deepBlue hover:shadow-xl group min-w-[300px]',
            layoutEffect == 'grid' ? 'flex-col h-[350px]' : 'flex-row h-32'
        ]">
        <!-- Thumbnail section -->
        <div :class="[
            'relative overflow-hidden transition-all duration-500 ease-in-out',
            layoutEffect == 'grid' ? 'h-[280px]' : 'h-full w-full max-w-[200px]'
        ]">
            <NuxtImg :src="experimentThumbnail" :alt="experimentName"
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