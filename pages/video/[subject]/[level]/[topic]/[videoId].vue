<script setup>
import apiDocs from "~/utilities/api-docs";

const route = useRoute();
// const router = useRouter();
const videoId = route.fullPath.split("/").pop();
const videoTitle = String(route.fullPath.split("/")[4])
    .toString()
    .replaceAll("%20", " ")
    .replaceAll("-", " ");
const videoStandard = String(route.fullPath.split("/")[2])
    .toString()
    .replaceAll("%20", " ");
const videoLevel = String(route.fullPath.split("/")[3])
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
</script>

<template>
    <NuxtLayout name="home-layout">
        <section class="relative inline-flex w-full overflow-hidden center-height">
            <!-- w-3/4 -->
            <div
                class="w-full py-5 lg:scroll-height lg:overflow-y-scroll lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                <!-- Videovideo Level Standard and Subject Indicator -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <NuxtLink :to="{ path: '/', query: { tab: 'video', subject: videoLevel, class: videoStandard } }"
                            class="items-center hidden gap-2 capitalize text-oceanBlue text-small md:flex">
                            {{
                            videoLevel != null &&
                                videoLevel != undefined &&
                                videoLevel != "null"
                                ? videoLevel
                                : `Secondary`
                        }}
                            <Icon name="weui:arrow-outlined" size="18" class="text-black" />
                        </NuxtLink>

                        <NuxtLink :to="{ path: '/', query: { tab: 'video', subject: videoLevel, class: videoStandard } }"
                            class="items-center hidden gap-2 capitalize text-oceanBlue text-small md:flex">
                            {{
                            videoStandard != null &&
                                videoStandard != undefined &&
                                videoStandard != "null"
                                ? videoStandard
                                : `Form One`
                        }}
                            <Icon name="weui:arrow-outlined" size="18" class="text-black" />
                        </NuxtLink>

                        <p class="font-medium uppercase text-medium md:capitalize">
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
                <div class=" md:px-4">
                    <video preload="auto" controls @contextmenu.prevent class="mx-auto rounded-md center-height">
                        <source :src="videoUrl" type="video/mp4">
                    </video>

                    <!-- Video Description and Thumbnail Image -->
                    <div class="flex items-center w-full h-full gap-4 my-4">
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
                </div>
            </div>

            <!-- Sidebar w-1/4 -->
            <!-- <div
                class="sidebar transition-all duration-700 ease-in-out absolute -right-[500%] lg:right-0 top-0 md:w-[400px] w-full h-full lg:w-1/4 p-2 lg:static center-height overflow-y-scroll bg-white">
                <div class="flex flex-col h-full mb-4">
                    <h1 class="pt-5 font-medium capitalize text-medium">Related Video</h1>
                    toggle menu
                    <div class="flex items-center justify-center w-5 h-5 transition-all duration-500 ease-in-out rounded-full cursor-pointer hover:bg-oceanBlue lg:hidden group"
                        @click="toggleSidebar()">
                        Cancel Icon
                        <Icon name="iconoir:cancel" size="18" class="group-hover:text-white" />
                    </div>

                    UL list of chapters
                    <ul class="flex flex-col gap-3 md:pl-4">
                        <li class="flex items-center gap-3 p-3 rounded-md cursor-pointer bg-containerGray">
                            <div class="">
                                <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
                            </div>
                            <div class="line-clamp-2">Introduction to Physics</div>
                        </li>
                        <li class="flex items-center gap-3 p-3 rounded-md cursor-pointer bg-containerGray">
                            <div class="">
                                <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
                            </div>
                            <div class="line-clamp-2">Learn motion</div>
                        </li>
                    </ul>
                </div>
            </div> -->
        </section>
    </NuxtLayout>
</template>
