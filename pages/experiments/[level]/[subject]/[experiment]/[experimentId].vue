<script setup>
import apiDocs from "~/utilities/api-docs";

const route = useRoute();
// const router = useRouter();
const experimentId = route.fullPath.split("/").pop();
const experimentTitle = String(route.fullPath.split("/")[4])
    .toString()
    .replaceAll("%20", " ")
    .replaceAll("-", " ");
const experimentStandard = String(route.fullPath.split("/")[2])
    .toString()
    .replaceAll("%20", " ");
const experimentLevel = String(route.fullPath.split("/")[3])
    .toString()
    .replaceAll("%20", " ");
const experimentUrl = `/api/experiment/${experimentId}`

// Header
useHead({
    title: `TIE - Tanzania/${experimentTitle}`,
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
const experimentInfo = ref();      // Initial experimentInfo state

// Define Cookie
const auth_token = useCookie('signInAccessToken').value;

// Fetch Experiments From Server
const fetchExperimentById = async () => {
    try {
        status.value = 'pending';
        const response = await $fetch(apiDocs.experiments.getExperimentId.replaceAll('{id}', experimentId), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${auth_token}`,
                'Content-Type': 'application/json'
            }
        });

        experimentInfo.value = response;
        status.value = 'success';

    } catch (error) {
        status.value = 'error';
        error.value = error
    }
}

// Call FetchExperiments Function
fetchExperimentById();

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
        <section class="relative w-full inline-flex center-height overflow-hidden">
            <!-- w-3/4 -->
            <div
                class="lg:w-3/4 w-full lg:scroll-height lg:overflow-y-scroll py-5 lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                <!-- Videovideo Level Standard and Subject Indicator -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <NuxtLink to="/video"
                            class="capitalize text-oceanBlue text-small hidden md:flex items-center gap-2">
                            {{
                                experimentLevel != null &&
                                    experimentLevel != undefined &&
                                    experimentLevel != "null"
                                    ? experimentLevel
                                    : `Secondary`
                            }}
                            <Icon name="weui:arrow-outlined" size="18" class="text-black" />
                        </NuxtLink>

                        <NuxtLink to="/video"
                            class="capitalize text-oceanBlue text-small hidden md:flex items-center gap-2">
                            {{
                                    experimentStandard != null &&
                                        experimentStandard != undefined &&
                                        experimentStandard != "null"
                                        ? experimentStandard
                                        : `Form One`
                                }}
                            <Icon name="weui:arrow-outlined" size="18" class="text-black" />
                        </NuxtLink>

                        <p class="text-medium uppercase md:capitalize font-medium">
                            {{
                                    experimentLevel != null &&
                                        experimentLevel != undefined &&
                                        experimentLevel != "null"
                                        ? experimentLevel
                                        : `Introduction to
                            Physics`
                                }}
                        </p>
                    </div>
                    <!-- Header Description -->
                    <div class="flex lg:hidden" @click="toggleSidebar()">
                        <Icon name="basil:menu-outline" class="cursor-pointer" size="2rem" />
                    </div>
                </div>

                <!-- Description -->
                <div class="notes md:px-4 max-w-7xl mx-auto">
                    <iframe class="center-height w-full" :src="useState('experimentUrl').value" frameborder="0"></iframe>

                    <!-- Video Description and Thumbnail Image -->
                    <div class="flex items-center w-full h-full gap-4 my-4">
                        <!-- Thumbnail Image -->
                        <div class="w-14 h-14 rounded-full overflow-hidden lg:flex hidden">
                            <NuxtImg :src="experimentInfo?.thumbnail" :alt="experimentInfo?.name"
                                class="w-full h-full object-cover transition-transform duration-500" />
                        </div>

                        <!-- Video Description -->
                        <div class="flex w-full">
                            <p class="text-sm text-justify">
                                {{ experimentInfo?.description }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar w-1/4 -->
            <div
                class="sidebar transition-all duration-700 ease-in-out absolute -right-[500%] lg:right-0 top-0 md:w-[400px] w-full h-full lg:w-1/4 p-2 lg:static center-height overflow-y-scroll bg-white">
                <div class="flex flex-col mb-4 h-full">
                    <h1 class="text-medium font-medium capitalize pt-5">Related Video</h1>
                    <!-- toggle menu -->
                    <div class="hover:bg-oceanBlue cursor-pointer rounded-full w-5 h-5 flex lg:hidden items-center justify-center group transition-all duration-500 ease-in-out"
                        @click="toggleSidebar()">
                        <!-- Cancel Icon -->
                        <Icon name="iconoir:cancel" size="18" class="group-hover:text-white" />
                    </div>

                    <!-- UL list of chapters -->
                    <ul class="flex flex-col gap-3 md:pl-4">
                        <li class="flex items-center gap-3 cursor-pointer p-3 rounded-md bg-containerGray">
                            <div class="">
                                <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
                            </div>
                            <div class="line-clamp-2">Introduction to Physics</div>
                        </li>
                        <li class="flex items-center gap-3 cursor-pointer p-3 rounded-md bg-containerGray">
                            <div class="">
                                <Icon name="mage:folder-2" class="cursor-pointer" size="1.5rem" />
                            </div>
                            <div class="line-clamp-2">Learn motion</div>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    </NuxtLayout>
</template>