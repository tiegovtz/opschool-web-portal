<script setup>
import apiDocs from "~/utilities/apiDocs";
import { ref, watchEffect, onMounted, onUnmounted } from "vue";
import { fetchAsyncData } from "~/composables/useAsyncFetch";

const route = useRoute();
const audioId = route.fullPath.split("/").pop();
const audioTitle = decodeURIComponent(route.fullPath.split("/")[4]?.replaceAll("-", " "));
const audioStandard = decodeURIComponent(route.fullPath.split("/")[2]);
const audioSubject = decodeURIComponent(route.fullPath.split("/")[3]);
const audioUrl = `/api/audio/${audioId}`;

// Head meta
useHead({
    title: `TIE - Tanzania/${audioTitle}`,
    meta: [
        { name: "description", content: "TIE is a digital learning platform..." },
        { name: "keywords", content: "Tanzania, education, e-learning" },
        { name: "author", content: "Tanzania Institute of Education" },
        { property: "og:title", content: "TIE - Tanzania Interactive Learning Platform" },
        { property: "og:description", content: "Explore educational resources for Tanzania." },
        { property: "og:image", content: "https://example.com/preview-image.jpg" },
        { property: "og:url", content: "https://tie.tz" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "TIE - Tanzania Interactive Learning Platform" },
        { name: "twitter:description", content: "Access quality educational content." },
        { name: "twitter:image", content: "https://example.com/preview-image.jpg" },
    ],
});

// Auth middleware
definePageMeta({
    middleware: 'auth',
});

// State
const status = ref('pending');
const error = ref(null);
const audioInfo = ref();

// Auth token
const auth_token = useCookie('signInAccessToken').value;

// Fetch audio info
const fetchAudioById = async () => {
    try {
        status.value = 'pending';
        const { data: response, status: fetchStatus } = await fetchAsyncData(`audio-${audioId}`, () => $fetch(apiDocs.audio.getById.replaceAll('{id}', audioId), {
            headers: {
                'Authorization': `Bearer ${auth_token}`,
                'Content-Type': 'application/json'
            }
        }))
        audioInfo.value = response.value;
        status.value = fetchStatus.value;
    } catch (err) {
        status.value = 'error';
        error.value = err;
    }
};
fetchAudioById();

// Sidebar toggle
const toggleSidebar = () => {
    if (import.meta.client) {
        const sidebar = document.querySelector(".sidebar");
        sidebar.classList.toggle("right-0");
    }
};

// Audio visualization setup
const canvasRef = ref(null);
const audioRef = ref(null);

let audioContext;
let analyser;
let source = null;
let animationId = null;

const startVisualizer = () => {
    const canvas = canvasRef.value;
    const audioEl = audioRef.value;

    if (!audioEl || !canvas) return;

    // Initialize context and analyser
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
    }

    // Only create source once
    if (!source) {
        source = audioContext.createMediaElementSource(audioEl);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
        animationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;

            // Create vertical gradient for each bar
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0.5, '#56ade8');
            gradient.addColorStop(0, '#e5563799');  
            gradient.addColorStop(1, '#28293833');    


            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    };



    draw();
};


onMounted(() => {
    watchEffect(() => {
        if (audioRef.value) {
            audioRef.value.addEventListener('play', () => {
                if (!audioContext || audioContext.state === 'suspended') {
                    audioContext?.resume();
                }
                startVisualizer();
            });
        }
    });
});

onUnmounted(() => {
    cancelAnimationFrame(animationId);
    source?.disconnect();
    analyser?.disconnect();
    audioContext?.close();
});

</script>

<template>
    <NuxtLayout name="home-layout">
        <section class="relative w-full overflow-hidden center-height">
            <div
                class="w-full py-5 lg:scroll-height lg:overflow-y-scroll lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <NuxtLink
                            :to="{ path: '/', query: { tab: 'audio', subject: audioSubject, class: audioStandard } }"
                            class="items-center hidden gap-2 p-1 capitalize border-2 rounded-full text-oceanBlue text-small md:flex border-oceanBlue">
                            <Icon name="vaadin:arrow-backward" size="26" class="text-oceanBlue" />
                        </NuxtLink>
                        <p class="font-medium text-medium">
                            {{
                                audioTitle != null &&
                                    audioTitle != undefined &&
                                    audioTitle != "null"
                                    ? audioTitle
                                    : `Introduction to Physics`
                            }}
                        </p>
                    </div>
                </div>

                <!-- Audio Player and Canvas Visualizer -->
                <div v-if="status == 'pending'">
                    <LoadingIndicator :is-loading="true" />
                </div>
                <div id="main-container" tabindex="-1" v-else-if="audioInfo && status == 'success'" class="md:px-4 notes">
                    <div class="flex flex-col items-center w-full h-full max-w-xl gap-4 mx-auto my-4 rounded-md">
                        <canvas ref="canvasRef" class="w-full h-32 mt-4 bg-white rounded-md md:h-40"></canvas>
                        <audio ref="audioRef" preload="auto" controls @contextmenu.prevent
                            class="w-full mx-auto bg-white rounded-md" nodownload controlslist="nodownload"
                            crossorigin="anonymous">
                            <source :src="audioUrl"
                                type="audio/mp3" />
                            <source :src="audioUrl"
                                type="audio/wav" />
                        </audio>
                    </div>


                    <div class="flex items-center w-full h-full gap-4 my-4" v-if="audioInfo">
                        <div class="hidden overflow-hidden rounded-full w-14 h-14 lg:flex">
                            <NuxtImg :src="audioInfo?.thumbnail" :alt="audioInfo?.name"
                                class="object-cover w-full h-full" />
                        </div>
                        <div class="flex w-full">
                            <p class="text-sm text-justify">{{ audioInfo?.description }}</p>
                        </div>
                    </div>

                    <!-- Prev/Next Buttons -->
                    <div :class="[
                        'flex items-center w-full',
                        audioInfo?.previous && audioInfo?.next ? 'justify-between' :
                            !audioInfo?.previous && audioInfo?.next ? 'justify-end' :
                                !audioInfo?.next && audioInfo?.previous ? 'justify-start' : '',
                    ]">
                        <NuxtLink v-if="audioInfo?.previous"
                            :to="{ path: `/audio/${audioStandard}/${audioSubject}/${audioInfo?.previous?.name}/${audioInfo?.previous?._id}` }"
                            class="p-2 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                            Previous audio
                        </NuxtLink>
                        <NuxtLink v-if="audioInfo?.next"
                            :to="{ path: `/audio/${audioStandard}/${audioSubject}/${audioInfo?.next?.name}/${audioInfo?.next?._id}` }"
                            class="p-2 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                            Next audio
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>
    </NuxtLayout>
</template>
