<script setup>

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
        required: true,
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

// "`/experiments/${experimentStandard.toLowerCase()}/${experimentSubject.toLowerCase()}/${experimentName.toLowerCase()}/${experimentId.toLowerCase()}`"
const setExperimentUrl =()=>{
    useState('experimentUrl',()=>props.experimentFileUrl)
}
</script>

<template>
    <NuxtLink
        :to="`/experiments/${experimentStandard.toLowerCase()}/${experimentSubject.toLowerCase()}/${experimentName.toLowerCase()}/${experimentId.toLowerCase()}`"
        class="relative flex flex-col rounded-lg overflow-hidden bg-white hover:bg-deepBlue shadow-md hover:shadow-xl transition-all duration-500 ease-in-out group cursor-pointer"
        style="height: 350px;"
        @click="setExperimentUrl()"
        >
        <!-- Thumbnail section -->
        <div class="relative overflow-hidden h-[280px]">
            <NuxtImg :src="experimentThumbnail" :alt="experimentName"
                class="w-full h-full object-cover transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>

            <!-- Play button -->
            <div
                class="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer">
                <button
                    class="flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm p-3 border border-white/30 transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                    aria-label="Play experiment">
                    <Icon name="icon-park-solid:experiment-one" class="text-white text-3xl" />
                </button>
            </div>
        </div>

        <!-- Content section -->
        <div class="flex flex-col p-4 flex-grow">
            <!-- <h3
                class="text-lg font-semibold mb-2 group-hover:text-white transition-colors duration-500 ease-in-out capitalize">
                {{ experimentName }}
            </h3> -->
            <p
                class="text-sm text-gray-600  group-hover:text-white transition-colors duration-500 ease-in-out mb-4 line-clamp-2">
                {{ experimentDescription }}
            </p>

            <!-- Metadata footer -->
            <!-- <div
                class="mt-auto flex items-center justify-end text-xs text-gray-500 group-hover:text-white transition-colors duration-500 ease-in-out">
                <span class="flex items-center">
                    <Icon name="heroicons:eye" class="mr-1 text-sm" />
                    1.2k views
                </span>
            </div> -->
        </div>
    </NuxtLink>
</template>