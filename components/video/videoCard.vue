<script setup>

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


</script>

<template>
    <NuxtLink
        :to="`/video/${videoStandard.toLowerCase()}/${videoSubject.toLowerCase()}/${videoName.toLowerCase()}/${videoId.toLowerCase()}`"
        class="relative flex flex-col rounded-lg overflow-hidden bg-white hover:bg-deepBlue shadow-md hover:shadow-xl transition-all duration-500 ease-in-out group cursor-pointer"
        style="height: 350px;">
        <!-- Thumbnail section -->
        <div class="relative overflow-hidden h-[280px]">
            <NuxtImg :src="videoThumbnail" :alt="videoName.toLowerCase()"
                class="w-full h-full object-cover transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>

            <!-- Play button -->
            <div
                class="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer">
                <button
                    class="flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm p-3 border border-white/30 transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                    aria-label="Play video">
                    <Icon name="heroicons:play-solid" class="text-white text-2xl" />
                </button>
            </div>
        </div>

        <!-- Content section -->
        <div class="flex flex-col p-4 flex-grow">
            <h3
                class="text-lg font-semibold mb-2 group-hover:text-white transition-colors duration-500 ease-in-out capitalize">
                {{ videoName }}
            </h3>
            <p
                class="text-sm text-gray-600  group-hover:text-white transition-colors duration-500 ease-in-out mb-4 line-clamp-2">
                {{ videoDescription }}
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