<script setup>
import apiDocsFile from "~/utilities/api-docs";
const apiDocs = apiDocsFile.setup()

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
const experimentSubject = String(route.fullPath.split("/")[3])
    .toString()
    .replaceAll("%20", " ");

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
const status = ref('pending');       // Initial status
const error = ref(null);            // Initial error state
const experimentInfo = ref();      // Initial experimentInfo state
const isFullscreen = ref(false);    // Initial isFullscreen state
const webglSupported = ref(true);   // Initial webglSupported state

// Check if WebGL is supported
if (import.meta.client) {
    webglSupported.value = !!window.WebGLRenderingContext;
}

// Define Cookie
const auth_token = useCookie('signInAccessToken').value;

// Fetch Experiments From Server
const fetchExperimentById = async () => {
    try {
        status.value = 'pending';
        const response = await $fetch(apiDocs.experiments.getExperimentId.replaceAll(':id', experimentId), {
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

// function for toggling  experiment fullscreeen
const fullScreen = () => {
    // experiment container
    const experimentContainer = document.getElementById(`experiment-container`);
    if (import.meta.client) {
        if (!isFullscreen.value) {
            experimentContainer.requestFullscreen();

        } else {
            document.exitFullscreen();

        }
        // set flag to opposite
        isFullscreen.value = !isFullscreen.value;
    }
}

// define authentication middleware
definePageMeta({
    middleware: 'auth'
})

// Define OnMounted
onMounted(() => {
    //Add event listener to window screen /full/exit
    document.addEventListener('fullscreenchange', () =>{
        isFullscreen.value = document.fullscreenElement !== null;
    })
    
})
</script>
<template>
    <NuxtLayout name="home-layout">
        <section class="relative inline-flex w-full overflow-hidden center-height">
            <!-- w-3/4 -->
            <div
                class="w-full py-5 lg:scroll-height lg:overflow-y-scroll lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                <!-- Experiments Level Standard and Subject Indicator -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <NuxtLink
                            :to="{ path: '/', query: { tab: 'experiments', subject: experimentSubject, class: experimentStandard } }"
                            class="items-center hidden gap-2 capitalize text-oceanBlue text-small md:flex">
                            {{
                                experimentSubject != null &&
                                    experimentSubject != undefined &&
                                    experimentSubject != "null"
                                    ? experimentSubject
                                    : `Secondary`
                            }}
                            <Icon name="weui:arrow-outlined" size="18" class="text-black" />
                        </NuxtLink>

                        <NuxtLink
                            :to="{ path: '/', query: { tab: 'experiments', subject: experimentSubject, class: experimentStandard } }"
                            class="items-center hidden gap-2 capitalize text-oceanBlue text-small md:flex">
                            {{
                                experimentStandard != null &&
                                    experimentStandard != undefined &&
                                    experimentStandard != "null"
                                    ? experimentStandard
                                    : `Form One`
                            }}
                            <Icon name="weui:arrow-outlined" size="18" class="text-black" />
                        </NuxtLink>

                        <p class="font-medium uppercase text-medium md:capitalize">
                            {{
                                    experimentTitle != null &&
                                        experimentTitle != undefined &&
                                        experimentTitle != "null"
                                        ? experimentTitle
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
                <div class="mx-auto notes md:px-4">
                    <LoadingIndicator :is-loading="status == 'pending'" v-if="status == 'pending'" v-trusted/>
                    <MessagePageNotFound v-else-if="status == 'error'" message="Error while loading experiment"
                        subMessage="Make sure you are connected to the stable internet or try to reload the page" v-trusted/>

                    <div class="relative w-full overflow-y-scroll rounded-md center-height" id="experiment-container"
<<<<<<< HEAD
                        v-else-if="status == 'success' && webglSupported" v-trusted>
=======
                        v-else-if="status == 'success' && webglSupported">
>>>>>>> 15ba4c35 (5:37PM)
                        <iframe :class="[
                                ' w-full  rounded-md',
                                isFullscreen ? ' min-h-dvh min-w-full' : 'h-full center-height',
                            ]" :src="experimentInfo.stepsFileUrl" frameborder="0"></iframe v-trusted>
                        <!-- full screen controls -->
                        <div class="absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 p-2 text-white transition-all duration-500 rounded-md cursor-pointer screen-control bg-oceanBlue hover:bg-white hover:text-oceanBlue"
                            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'" @click="fullScreen">
                            <Icon v-if="isFullscreen" name="qlementine-icons:fullscreen-exit-16" size="24" v-trusted/>
                            <Icon v-else name="qlementine-icons:fullscreen-16" size="24" v-trusted/>
                        </div>
                    </div>

                    <div v-else-if="status == 'success' && !webglSupported"
                        class="flex items-center justify-center w-full h-full">
                        <p class="text-lg text-red-500">
                            This feature is not supported in your browser. Please try a different
                            browser or device.
                        </p>
                    </div>

                    <!-- experiment Description and Thumbnail Image -->
                    <div class="flex items-center w-full h-full gap-4 my-4">
                        <!-- Thumbnail Image -->
                        <div class="hidden overflow-hidden rounded-full w-14 h-14 lg:flex">
                            <NuxtImg :src="experimentInfo?.thumbnail" :alt="experimentInfo?.name"
                                class="object-cover w-full h-full transition-transform duration-500" />
                        </div>

                        <!-- experiment Description -->
                        <div class="flex w-full" v-trusted>
                            <p class="text-sm text-justify">
                                {{ experimentInfo?.description }}
                            </p>
                        </div>
                    </div>

                      <!-- Next and Prev BUTTON -->
                     <div class="flex items-center justify-between w-full">
                        <NuxtLink :to="{path:`/experiments/${experimentStandard}/${experimentSubject}/${experimentInfo?.previous?.name}/${experimentInfo?.previous?._id}`}" v-if="experimentInfo?.previous" class="p-2 text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue">
                            Prev experiment
                        </NuxtLink>
                        <NuxtLink :to="{path:`/experiments/${experimentStandard}/${experimentSubject}/${experimentInfo?.next?.name}/${experimentInfo?.next?._id}`}" v-if="experimentInfo?.next" class="p-2 text-white transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue">
                            Next experiment
                        </NuxtLink>
                     </div>
                </div>
            </div>

            <!-- Sidebar w-1/4 -->
            <!-- <div
                class="sidebar transition-all duration-700 ease-in-out absolute -right-[500%] lg:right-0 top-0 md:w-[400px] w-full h-full lg:w-1/4 p-2 lg:static center-height overflow-y-scroll bg-white">
                <div class="flex flex-col h-full mb-4">
                    <h1 class="pt-5 font-medium capitalize text-medium">Related Experiments</h1> -->
            <!-- toggle menu -->
            <!-- <div class="flex items-center justify-center w-5 h-5 transition-all duration-500 ease-in-out rounded-full cursor-pointer hover:bg-oceanBlue lg:hidden group"
                        @click="toggleSidebar()"> -->
            <!-- Cancel Icon -->
            <!-- <Icon name="iconoir:cancel" size="18" class="group-hover:text-white" />
                    </div> -->

            <!-- UL list of chapters -->
            <!-- <ul class="flex flex-col gap-3 md:pl-4">
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