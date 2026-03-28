<script lang="ts" setup>
import { IconsMdiBookOpenPageVariantOutline, UiBackButton } from '#components';
import apiDocs from '~/utilities/apiDocs';
import type { IconType } from '../icons/stats.vue';
import type { Audios } from '~/types/audio.interface';
import type { Videos } from '~/types/video.interface';
import type { Experiment } from '~/types/experiment.interface';
import type { Topic } from '~/types/topic.interface';


const educationLevels = [
    {
        name: 'Elimu ya Msingi', description: `Pata masomo shirikishi, shughuli za kujifunzia, na nyenzo za elimu zilizoundwa kwa ajili ya wanafunzi wa shule ya msingi.`,
        path: '/nyumbani',
        classList: ['bg-gradient-to-br from-[#4EA3D8] to-[#89C6F2] '],
        icon: IconsMdiBookOpenPageVariantOutline,
        images: [{
            src: '/images/c43f7a911cc7ca9.png',
            alt: ``
        }],
        motivation: `Tembelea Maudhui ya Elimu ya Msingi`
    },
    {
        name: 'Secondary Education', description: `Access advanced lessons, instructional
videos, and educational resources
designed for secondary school students.`, path: '/home',
        classList: ['bg-gradient-to-br from-[#1F6FB2] to-[#3DA0E3] '],
        icon: IconsMdiBookOpenPageVariantOutline,
        images: [{
            src: '/images/cd228f4bc.png',
            alt: ``
        }],
        motivation: `Explore Secondary Content`
    },
];

const stats = [
    {
        value: "2,400+",
        label: "Mada za kujifunza",
        detail: "Msingi na sekondari",
        icon: "library",
        accent: "blue",
        data: 'topics'
    },
    {
        value: "860+",
        label: "Video na vielelezo",
        detail: "Masomo ya kuona",
        icon: "play",
        accent: "cyan",
        data: 'resources'
    },
    {
        value: "24/7",
        label: "Upatikanaji",
        detail: "Muda wote",
        icon: "clock",
        accent: "blue",
        data: 'time'
    },
    // {
    //   value: "860+",
    //   label: "Video na vielelezo",
    //   detail: "Masomo ya kuona",
    //   icon: "play",
    //   accent: "cyan",
    // },
];

function getAccentStyles(accent: string) {
    if (accent === "cyan") {
        return {
            tile: "bg-[linear-gradient(135deg,#2d7cf5_0%,#4ec9f5_100%)]",
            value: "text-[#1f6fb2]",
        };
    }

    if (accent === "navy") {
        return {
            tile: "bg-[linear-gradient(135deg,#1f6fb2_0%,#174f80_100%)]",
            value: "text-[#124f86]",
        };
    }

    if (accent === "gold") {
        return {
            tile: "bg-[linear-gradient(135deg,#ff8a34_0%,#ffc83d_100%)]",
            value: "text-[#f09a12]",
        };
    }

    if (accent === "green") {
        return {
            tile: "bg-[linear-gradient(135deg,#7bcd3f_0%,#9ddc4c_100%)]",
            value: "text-[#54a52e]",
        };
    }

    if (accent === "red") {
        return {
            tile: "bg-[linear-gradient(135deg,#ab2d1f_0%,#f02f59_100%)]",
            value: "text-[#df3d55]",
        };
    }

    return {
        tile: "bg-[linear-gradient(135deg,#2d7cf5_0%,#4ebdf1_100%)]",
        value: "text-[#1f6fb2]",
    };
}

// fetch data from server
const allContent = ref<number>(0)
const allTopics = ref<number>(0)
const fetchData = async () => {
    let reqwest: any[] = [
        $fetch(apiDocs.audio.getPublicAudio),
        $fetch(apiDocs.videos.getPublicVideo),
        $fetch(apiDocs.experiments.getPublicExperiments),
        $fetch(apiDocs.topics.filterTopics)
    ]
    try {
        const [audios, videos, experiments, topics] = await Promise.allSettled(reqwest);
        const getLength = (res: any) => {
            console.log(res);

            return res.status === "fulfilled" ? res?.value?.length || 0 : 0
        }

        // const totalChapters = (topics as any)?.value?.reduce(
        //     (sum: number, topic: any) => sum + (topic.totalChapter || 0),
        //     0
        // ) || 0;
        allContent.value = getLength(audios) + getLength(videos) + getLength(experiments);
        allTopics.value = getLength(topics);
    } catch (error) {
        console.error("[Failed to process data]:", error);

    }
}


onMounted(async () => {
    await fetchData()
})
</script>

<template>
    <div
        class="mt-8 grid grid-cols-1 items-start gap-10 lg:mt-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:items-stretch lg:gap-12">
        <section class="max-w-screen-md mx-auto">
            <h1 class="text-left text-xl font-tahomabd font-bold text-oceanBlue">Karibu!</h1>
            <h1 class="text-left text-3xl my-4 font-tahomabd font-bold text-[#f29253]">TIE ONLINE SCHOOL</h1>
            <p class="text-justify mt-4">Katika platfom hii utapata maudhui ya elimu ya msingi, sekondari na elimu ya
                ualimu. chagua ili kuendelea.
            </p>
            <!-- buttons -->
            <div class="flex flex-wrap gap-5 pt-5">
                <UiButtonShineParticles @click="$router.push('/nyumbani')" label="Primary" />
                <UiButtonShineParticles @click="$router.push('/home')" label="Secondary" />
            </div>

            <!-- static -->
            <div class="grid gap-4 pt-6 mt-4 min-w-0 sm:pt-8 md:grid-cols-2 md:mt-8 lg:mt-12 lg:pt-10">
                <div v-for="(stat, idx) in stats" :key="`${idx}-${stat.label}`"
                    class="group relative min-h-0 overflow-hidden rounded-[2rem] border border-[#e4edf5] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,251,255,0.98)_100%)] px-5 py-5 shadow-[0px_18px_40px_rgba(18,79,134,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_24px_48px_rgba(18,79,134,0.14)]">
                    <div
                        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(108,180,229,0.08),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div class="relative flex items-center gap-4">
                        <div :class="`flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.55rem]
                        text-white shadow-[0px_12px_22px_rgba(31,111,178,0.2)] ${getAccentStyles(stat.accent).tile}`">
                            <IconsStats :type="(stat.icon as IconType)" />
                        </div>
                        <div class="min-w-0">
                            <p class="text-[15px] font-medium leading-6 text-[#30475d] md:text-base">
                                {{ stat.label }}
                            </p>
                            <p :class="`mt-1 text-[24px] font-bold leading-none tracking-[-0.02em] md:text-[28px]
                            ${getAccentStyles(stat.accent).value}`">
                                {{ stat.data === 'topics' ? `${allTopics}+` : stat.data == 'resources' ? `${allContent}+` :
                                stat.value }}
                            </p>
                            <p class="mt-1 text-sm leading-5 text-[#72879a]">
                                {{ stat.detail }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </section>
        <!-- slides -->
        <section class="hidden md:block w-full overflow-hidden rounded-3xl">
            <SliderShow mahal-ilipo="landing" />
        </section>
    </div>
</template>