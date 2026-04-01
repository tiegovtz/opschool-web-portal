<script lang="ts" setup>
import { IconsMdiBookOpenPageVariantOutline, UiBackButton } from '#components';
import apiDocs from '~/utilities/apiDocs';
import type { IconType } from '../icons/stats.vue';
import { setPostLoginHome } from '~/utilities/postLoginHome';
import { getHubPath } from '~/utilities/educationRoute';

const router = useRouter();
const hubHeaderLang = useHubHeaderLanguage();
const hubEducationLevel = useHubEducationLevel();
const primaryContentLanguage = usePrimaryContentLanguage();

function goToPrimary() {
    const target = getHubPath('primary');
    setPostLoginHome(target);
    hubHeaderLang.value = 'kiswahili';
    hubEducationLevel.value = 'primary';
    primaryContentLanguage.value = 'kiswahili';
    router.push(target);
}

function goToSecondary() {
    const target = getHubPath('secondary');
    setPostLoginHome(target);
    hubHeaderLang.value = 'english';
    hubEducationLevel.value = 'secondary';
    router.push(target);
}

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
        class="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-12 py-4">
        <section class="max-w-screen-md mx-auto">
            <h1 class="text-left text-xl font-tahomabd font-bold text-oceanBlue">Karibu!</h1>
            <h1 class="text-left text-3xl my-4 font-tahomabd font-bold text-[#f29253]">TIE ONLINE SCHOOL</h1>
            <p class="text-justify mt-4">Katika platfom hii utapata maudhui ya elimu ya msingi, sekondari na elimu ya
                ualimu. chagua ili kuendelea.
            </p>
            <!-- buttons -->
            <div class="flex flex-wrap gap-5 pt-5">
                <UiButtonShineParticles @click="goToPrimary" label="Primary" />
                <UiButtonShineParticles @click="goToSecondary" label="Secondary" />
            </div>

            <!-- static -->
            <div class="flex flex-wrap lg:grid gap-4 pt-15 xl:grid-cols-2 mt-4 md:mt-8 lg:mt-16">
                <div v-for="(stat, idx) in stats" :key="`${idx}-${stat.label}`"
                    class="group relative overflow-hidden rounded-[2rem] border border-[#e4edf5] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,251,255,0.98)_100%)] px-5 py-4 shadow-[0px_18px_40px_rgba(18,79,134,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_24px_48px_rgba(18,79,134,0.14)] w-full md:max-w-60">
                    <div
                        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(108,180,229,0.08),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div class="relative flex items-center gap-4">
                        <div :class="`hidden lg:flex lg:h-10 lg:w-10 h-9 w-9 shrink-0 items-center justify-center rounded-lg
                        text-white shadow-[0px_12px_22px_rgba(31,111,178,0.2)] ${getAccentStyles(stat.accent).tile}`">
                            <IconsStats :type="(stat.icon as IconType)" />
                        </div>
                        <div class="min-w-0">
                            <p class="hidden lg:block text-[15px] font-medium leading-6 text-[#30475d] md:text-base">
                                {{ stat.label }}
                            </p>
                            <p :class="`mt-1 text-[24px] font-bold leading-none tracking-[-0.02em] md:text-xl
                            ${getAccentStyles(stat.accent).value}`">
                                {{ stat.data === 'topics' ? `${allTopics}+` : stat.data == 'resources' ?
                                    `${allContent}+` :
                                stat.value }}
                            </p>
                            <p class="lg:hidden text-[15px] font-medium leading-6 text-[#30475d] md:text-base">
                                {{ stat.label }}
                            </p>
                            <p class="lg:mt-1 text-sm leading-5 text-[#72879a]">
                                {{ stat.detail }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </section>
        <!-- slides -->
        <section class="w-full overflow-hidden rounded-3xl">
            <SliderShow variant="landing" />
        </section>
    </div>
</template>
