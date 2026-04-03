<script setup>
import apiDocs from "~/utilities/apiDocs";

const route = useRoute();
const router = useRouter();
const videoId = route.fullPath.split("/").pop();
const videoTitle = String(route.fullPath.split("/")[4])
    .toString()
    .replaceAll("%20", " ")
    .replaceAll("-", " ");
const videoStandard = String(route.fullPath.split("/")[2])
    .toString()
    .replaceAll("%20", " ");
const videoSubject = String(route.fullPath.split("/")[3])
    .toString()
    .replaceAll("%20", " ");
const videoUrl = `/api/video/${videoId}`

// Header
useHead({
    title: `TIE - Tanzania/${videoTitle}`,
    meta: [
        {
            name: "description",
            content:
                "TIE is a digital learning platform providing quality educational resources for students and teachers in Tanzania.",
        },
        {
            name: "keywords",
            content:
                "Tanzania, education, interactive learning, e-learning, students, teachers",
        },
        { name: "author", content: "Tanzania Institute of Education" },

        // Open Graph (OG) meta tags for social sharing
        {
            property: "og:title",
            content: "TIE - Tanzania Interactive Learning Platform",
        },
        {
            property: "og:description",
            content:
                "Explore interactive educational resources for students and teachers in Tanzania.",
        },
        { property: "og:image", content: "https://example.com/preview-image.jpg" }, // Replace with actual image URL
        { property: "og:url", content: "https://tie.tz" },
        { property: "og:type", content: "website" },

        // Twitter Card meta tags
        { name: "twitter:card", content: "summary_large_image" },
        {
            name: "twitter:title",
            content: "TIE - Tanzania Interactive Learning Platform",
        },
        {
            name: "twitter:description",
            content:
                "Access quality educational content for students and teachers in Tanzania.",
        },
        { name: "twitter:image", content: "https://example.com/preview-image.jpg" }, // Replace with actual image URL
    ],
});

// Define state variables
const status = ref('pending');  // Initial status
const error = ref(null);       // Initial error state
const videoInfo = ref();      // Initial videoInfo state

// Define Cookie
const auth_token = useCookie('signInAccessToken').value;

// Fetch Videos From Server
const fetchVideoById = async () => {
    try {
        status.value = 'pending';
        const response = await $fetch(apiDocs.videos.getVideoById.replaceAll('{id}', videoId), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${auth_token}`,
                'Content-Type': 'application/json'
            }
        });

        videoInfo.value = response;
        status.value = 'success';

    } catch (error) {
        status.value = 'error';
        error.value = error
    }
}

// Call FetchVideos Function
fetchVideoById();

const goBack = () => {
    router.back();
};

// Toggle Sidebar
const toggleSidebar = () => {
    if (import.meta.client) {
        const sidebar = document.querySelector(".sidebar");
        sidebar.classList.toggle("right-0");
    }
};

// define authentication middleware
definePageMeta({
    middleware: 'auth'
})

const contentLayoutLanguage = useContentLayoutLanguage(() => route.params.level);
</script>

<template>
    <NuxtLayout name="home-layout" :language="contentLayoutLanguage">
        <section class="relative w-full overflow-hidden center-height">
            <div
                class="w-full py-5 lg:scroll-height lg:overflow-y-scroll lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                <!-- Videovideo Level Standard and Subject Indicator -->
                <div class="flex w-full min-w-0 items-center justify-between gap-2">
                    <div class="flex min-w-0 flex-1 items-center gap-2">
                        <button
                            type="button"
                            class="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-oceanBlue p-2 text-oceanBlue transition-colors hover:bg-oceanBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/50"
                            aria-label="Go back"
                            @click="goBack"
                        >
                            <Icon name="vaadin:arrow-backward" size="22" class="text-oceanBlue" aria-hidden="true" />
                        </button>

                        <p class="min-w-0 flex-1 truncate font-medium text-medium">
                            {{
                                videoTitle != null &&
                                    videoTitle != undefined &&
                                    videoTitle != "null"
                                    ? videoTitle
                                    : `Introduction to
                            Physics`
                            }}
                        </p>
                    </div>
                    <!-- Header Description -->
                    <!-- <div class="flex lg:hidden" @click="toggleSidebar()">
                        <Icon name="basil:menu-outline" class="cursor-pointer" size="2rem" />
                    </div> -->
                </div>

                <!-- Description -->
                <div class=" md:px-4 notes">
                    <video id="main-container" tabindex="-1" preload="auto" controls @contextmenu.prevent class="mx-auto rounded-md">
                        <source :src="videoUrl" type="video/mp4">
                    </video>

                    <!-- Video Description and Thumbnail Image -->
                    <div class="flex items-center w-full h-full gap-4 my-4" v-if="videoInfo">
                        <!-- Thumbnail Image -->
                        <div class="hidden overflow-hidden rounded-full w-14 h-14 lg:flex">
                            <NuxtImg :src="videoInfo?.thumbnail" :alt="videoInfo?.name"
                                class="object-cover w-full h-full transition-transform duration-500" />
                        </div>

                        <!-- Video Description -->
                        <div class="flex w-full">
                            <p class="text-sm text-justify">
                                {{ videoInfo?.description }}
                            </p>
                        </div>
                    </div>

                    <!-- Next and Prev BUTTON -->
                    <div :class="[
                        'flex items-center w-full',
                        videoInfo?.previous && videoInfo?.next ? 'justify-between'
                            : !videoInfo?.previous && videoInfo?.next ? 'justify-end'
                                : !videoInfo?.next && videoInfo?.previous ? 'justify-start' : '',
                    ]">
                        <NuxtLink
                            :to="{ path: `/video/${videoStandard}/${videoSubject}/${videoInfo?.previous?.name}/${videoInfo?.previous?._id}` }"
                            v-if="videoInfo?.previous"
                            class="p-2 text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue">
                            Previous video
                        </NuxtLink>
                        <NuxtLink
                            :to="{ path: `/video/${videoStandard}/${videoSubject}/${videoInfo?.next?.name}/${videoInfo?.next?._id}` }"
                            v-if="videoInfo?.next"
                            class="p-2 text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue">
                            Next video
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>
    </NuxtLayout>
</template>
