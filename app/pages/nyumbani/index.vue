<script lang="ts" setup>
import CustomGridOne from "~/components/home/customGridOne.vue";
import AudioCard from "~/components/audio/audioCard.vue";
import ExperimentsCard from "~/components/experiments/experimentsCard.vue";
import HeroSection from "~/components/home/HeroSection.vue";
import HomeSearchbar from "~/components/home/Searchbar.vue";
import LoadingIndicator from "~/components/loading/loadingIndicator.vue";
import SubjectCard from "~/components/home/SubjectCard.vue";
import TabBar from "~/components/home/TabBar.vue";
import TopicCard from "~/components/home/TopicCard.vue";
import VideoCard from "~/components/video/videoCard.vue";
import {
    getNyumbaniLevelName,
    getNyumbaniSubjectName,
    groupNyumbaniItemsBySubject,
    nyumbaniAudios,
    nyumbaniExperiments,
    type NyumbaniFilterableItem,
    type NyumbaniGroupedItem,
    nyumbaniSubjects,
    nyumbaniTopics,
    nyumbaniVideos,
} from "~/data/nyumbani.mock";
import type { Audios } from "~/types/audio.interface";
import type { Experiment } from "~/types/experiment.interface";
import type { GroupedData } from "~/types/grouped.data";
import type { Subjects } from "~/types/subject.interface";
import type { Topic } from "~/types/topic.interface";
import type { tabs } from "~/types/types.data";
import type { Videos } from "~/types/video.interface";
import { layoutEffect, screenWidth } from "~/utilities/controlls";

useHead({
    title: "TIE - Nyumbani",
    meta: [
        {
            name: "description",
            content:
                "Nyumbani hub ya maudhui ya kujifunzia ya TIE yenye data ya mfano kwa maendeleo ya frontend.",
        },
    ],
});

const userToken = useCookie("signInUserToken");
const {$router}=useNuxtApp();
const currentPage = ref(1);
const pageSize = ref(12);
const activeTab = ref<tabs>("subjects");
const status = ref<"pending" | "success">("pending");
const searchTerm = ref("");
const selectedLevel = ref("all");
const selectedSubject = ref("all");
const subjectId = ref("");
const subjectName = ref("");
const subjectSlug = ref("");
const seeMoreDetails = ref<string | null>(null); // Initial See More
const isLoggedIn = computed(() => Boolean(userToken.value));
const hasPublicFilters = computed(
    () =>
        Boolean(searchTerm.value.trim()) ||
        selectedLevel.value !== "all" ||
        selectedSubject.value !== "all",
);
const isSubjectDetail = computed(() => Boolean(subjectId.value));

const contentTab = computed<tabs>(() => {
    if (isSubjectDetail.value) return "interactive-contents";
    if (isLoggedIn.value) return activeTab.value;
    return hasPublicFilters.value ? "interactive-contents" : "subjects";
});

const TAB_TO_ROUTE: Record<tabs, { path: string; query?: Record<string, any> }> = {
  subjects: { path: "/home" },
  "interactive-contents": { path: "/interactive" },
  "learn-activities": { path: "/experiments" },
  video: { path: "/video", query: { type: "conc" } },
  "class-videos": { path: "/video", query: { type: "oth" } },
  audio: { path: "/audio" },
  "smart-class": { path: "/smart-class" },
};

const sectionTitle = computed(() => {
    if (isSubjectDetail.value) {
        return `${subjectName.value || "Somo"}: maudhui yanayoendelea`;
    }

    switch (contentTab.value) {
        case "interactive-contents":
            return "Maudhui shirikishi";
        case "learn-activities":
            return "Shughuli za ujifunzaji";
        case "video":
            return "Video za dhana";
        case "class-videos":
            return "Video za darasani";
        case "audio":
            return "Masomo ya sauti";
        default:
            return "Masomo yaliyopangwa kwa urahisi";
    }
});

const sectionDescription = computed(() => {
    if (isSubjectDetail.value) {
        return "Haya ni maudhui ya mfano kwa somo ulilochagua. Yanawezesha frontend kuendelea kabla ya endpoint halisi kukamilika.";
    }

    switch (contentTab.value) {
        case "interactive-contents":
            return "Chagua mada, darasa na somo ili kuhakiki cards, filters na pagination kwa kutumia mock data.";
        case "learn-activities":
            return "Majaribio haya ni ya mfano tu na yameandaliwa kusaidia muundo wa frontend bila utegemezi wa API.";
        case "video":
            return "Video hizi za dhana ni dataset ya muda kwa ukaguzi wa tab, grouping na layout.";
        case "class-videos":
            return "Hapa kuna class videos za mfano za kuonyesha mwendelezo wa muonekano wa ukurasa.";
        case "audio":
            return "Masomo ya sauti ni ya muda na yanafanya tab hii ibaki na data wakati backend haijapatikana.";
        default:
            return "Masomo haya ya mfano yanawezesha kukagua loader, uchaguzi wa somo na mtiririko wa ukurasa bila endpoint.";
    }
});

const currentSourceItems = computed<NyumbaniFilterableItem[]>(() => {
    switch (contentTab.value) {
        case "interactive-contents":
            return nyumbaniTopics.filter((topic) =>
                subjectId.value
                    ? getNyumbaniSubjectName(topic) === subjectName.value
                    : true,
            );
        case "learn-activities":
            return nyumbaniExperiments.filter((experiment) =>
                subjectId.value
                    ? getNyumbaniSubjectName(experiment) === subjectName.value
                    : true,
            );
        case "video":
            return nyumbaniVideos.filter(
                (video) =>
                    video.videoType === "conceptual" &&
                    (subjectId.value
                        ? getNyumbaniSubjectName(video) === subjectName.value
                        : true),
            );
        case "class-videos":
            return nyumbaniVideos.filter(
                (video) =>
                    video.videoType === "class-video" &&
                    (subjectId.value
                        ? getNyumbaniSubjectName(video) === subjectName.value
                        : true),
            );
        case "audio":
            return nyumbaniAudios.filter((audio) =>
                subjectId.value
                    ? getNyumbaniSubjectName(audio) === subjectName.value
                    : true,
            );
        default:
            return nyumbaniSubjects;
    }
});

const matchesSearch = (item: NyumbaniFilterableItem, query: string) => {
    if (!query) return true;

    const searchBlob = [
        item.name,
        "description" in item ? item.description : "",
        "descriptions" in item ? item.descriptions : "",
        getNyumbaniLevelName(item),
        getNyumbaniSubjectName(item),
    ]
        .join(" ")
        .toLowerCase();

    return searchBlob.includes(query);
};

const filteredItems = computed<NyumbaniFilterableItem[]>(() => {
    const normalizedSearch = searchTerm.value.trim().toLowerCase();

    return currentSourceItems.value.filter((item) => {
        const itemLevel = getNyumbaniLevelName(item);
        const itemSubject = getNyumbaniSubjectName(item);

        const levelMatches =
            selectedLevel.value === "all" || itemLevel === selectedLevel.value;
        const subjectMatches =
            selectedSubject.value === "all" || itemSubject === selectedSubject.value;

        return (
            levelMatches && subjectMatches && matchesSearch(item, normalizedSearch)
        );
    });
});

const groupedItems = computed(() =>
    groupNyumbaniItemsBySubject(filteredItems.value as NyumbaniGroupedItem[]),
);
const groupedTopics = computed(
    () => groupedItems.value as GroupedData<Topic>[],
);

const useGroupedView = computed(
    () =>
        isLoggedIn.value &&
        !isSubjectDetail.value &&
        contentTab.value !== "subjects",
);

const totalPages = computed(() => {
    if (useGroupedView.value) return 1;
    return filteredItems.value.length
        ? Math.ceil(filteredItems.value.length / pageSize.value)
        : 0;
});

const paginatedItems = computed(() => {
    if (useGroupedView.value) return filteredItems.value;

    const start = (currentPage.value - 1) * pageSize.value;
    return filteredItems.value.slice(start, start + pageSize.value);
});

const resultCount = computed(() => filteredItems.value.length);
const pageNumbers = computed(() =>
    Array.from({ length: totalPages.value }, (_, index) => index + 1),
);

const availableLevels = computed(() => {
    const items = currentSourceItems.value.filter((item) => {
        if (selectedSubject.value === "all") return true;
        return getNyumbaniSubjectName(item) === selectedSubject.value;
    });

    return Array.from(
        new Set(
            items
                .map((item) => getNyumbaniLevelName(item))
                .filter((level): level is string => Boolean(level)),
        ),
    );
});

const availableSubjects = computed(() => {
    if (contentTab.value === "subjects" || isSubjectDetail.value) return [];

    const items = currentSourceItems.value.filter((item) => {
        if (selectedLevel.value === "all") return true;
        return getNyumbaniLevelName(item) === selectedLevel.value;
    });

    return Array.from(
        new Set(
            items
                .map((item) => getNyumbaniSubjectName(item))
                .filter((subject): subject is string => Boolean(subject)),
        ),
    );
});

const showSubjectFilter = computed(
    () => contentTab.value !== "subjects" && !isSubjectDetail.value,
);

const updatePageSize = () => {
    if (screenWidth.value >= 1280) {
        pageSize.value = 12;
    } else if (screenWidth.value >= 1024) {
        pageSize.value = 9;
    } else if (screenWidth.value >= 768) {
        pageSize.value = 6;
    } else {
        pageSize.value = 4;
    }
};

watch(
    () => screenWidth.value,
    () => {
        updatePageSize();
    },
    { immediate: true },
);

watch(
    [filteredItems, pageSize],
    () => {
        if (!totalPages.value) {
            currentPage.value = 1;
            return;
        }

        if (currentPage.value > totalPages.value) {
            currentPage.value = totalPages.value;
        }
    },
    { immediate: true },
);

watch(
    [contentTab, searchTerm, selectedLevel, selectedSubject, subjectId],
    () => {
        currentPage.value = 1;
    },
);

watch(
    () => contentTab.value,
    () => {
        if (contentTab.value === "subjects") {
            selectedLevel.value = "all";
            selectedSubject.value = "all";
        }
    },
);

watch(
    () => selectedLevel.value,
    (level) => {
        if (level === "all") return;
        if (!availableLevels.value.includes(level)) {
            selectedLevel.value = "all";
        }
    },
);

watch(
    () => selectedSubject.value,
    (subject) => {
        if (subject === "all") return;
        if (!availableSubjects.value.includes(subject)) {
            selectedSubject.value = "all";
        }
    },
);

let loaderTimeout: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
    layoutEffect.value = "grid";
    loaderTimeout = setTimeout(() => {
        status.value = "success";
    }, 350);
});

onBeforeUnmount(() => {
    if (loaderTimeout) {
        clearTimeout(loaderTimeout);
    }
});

const resetFilters = () => {
    searchTerm.value = "";
    selectedLevel.value = "all";
    selectedSubject.value = "all";
};

const clearSubjectDetail = () => {
    subjectId.value = "";
    subjectName.value = "";
    subjectSlug.value = "";
    activeTab.value = "subjects";
    resetFilters();
};

// switch tabs 
const switchTab = async (tab: tabs) => {
  if (!tab) return;

  activeTab.value = tab;

  if (tab !== "subjects") {
    subjectId.value = "";
    subjectSlug.value = "";
    subjectName.value = "";
  }

  const target = TAB_TO_ROUTE[tab] ?? { path: "/home" };
  await $router.push(target);
};
const handleSubjectSelect = (id: string, name: string) => {
    subjectId.value = id;
    subjectName.value = name;
    subjectSlug.value = name.toLowerCase().trim().replace(/\s+/g, "-");
    selectedSubject.value = "all";
};

const slugifySubject = (value: string) =>
    value ? value.toLowerCase().trim().replace(/\s+/g, "-") : "";

const goToPage = (page: number) => {
    currentPage.value = page;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value += 1;
    }
};

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value -= 1;
    }
};

const visibleSubjects = computed(() => paginatedItems.value as Subjects[]);
const visibleTopics = computed(() => paginatedItems.value as Topic[]);

</script>

<template>
    <NuxtLayout name="home-layout" language="kiswahili">
        <section v-if="isLoggedIn" class="space-y-6">
            <HomeSearchbar appearance="rounded" language="kiswahili" education-level="primary" />
        </section>

        <section v-else>
            <HeroSection language="kiswahili" />
        </section>

        <section class="space-y-6">
            <TabBar class="my-4" :is-logged-in="true" :active-tab="contentTab" @emit-active-tab="switchTab($event)"
                tab-group="primary" />

            <HomeInputsSelection v-if="!isLoggedIn" education-level="primary" language="kiswahili" />

            <div v-if="status === 'pending'" class="flex min-h-[320px] items-center justify-center">
                <LoadingIndicator :is-loading="true" />
            </div>

            <template v-else>
                <div v-if="contentTab === 'subjects' && visibleSubjects.length > 0">
                    <CustomGridOne active-tab="subjects">
                        <template #data>
                            <SubjectCard v-for="subject in visibleSubjects" :key="subject._id" :subject-id="subject._id"
                                :subject-name="subject.name" :subject-image="subject.thumbnail"
                                :subject-description="subject.description" :total-views="subject.views ?? 0"
                                :is-logged-in="true" :alt-text="subject.alt"
                                @emit-subject-id="handleSubjectSelect($event, subject.name)" />
                        </template>
                    </CustomGridOne>
                </div>

                <div v-else-if="
                    contentTab === 'interactive-contents' && visibleTopics.length > 0
                ">
                    <CustomGridOne active-tab="interactive-contents">
                        <template #data>
                            <TopicCard v-for="topic in visibleTopics" :key="topic._id" :topic-id="topic._id"
                                :topic-image="topic.thumbnail" :topic-title="topic.name"
                                :topic-description="topic.descriptions" topic-duration="Dakika 10" :topic-likes="100"
                                :topic-views="topic.viewedBy?.length || topic.views || 0"
                                :topic-level="getNyumbaniLevelName(topic)" :topic-standard="getNyumbaniLevelName(topic)"
                                :subject-name="getNyumbaniSubjectName(topic)" :topic-viewed="topic.isViewed"
                                :topic-progress="topic.avgProgress" :alt-text="topic.alt" />
                        </template>
                    </CustomGridOne>
                </div>

                <EmptyState v-else title="Hakuna maudhui kwa sasa"
                    description="Badilisha vichujio au jaribu somo tofauti. Data hii ya mfano itaongezwa kadri endpoint halisi itakapokuwa tayari." />

                <div v-if="!useGroupedView && totalPages > 1"
                    class="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button type="button"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="currentPage === 1" @click="prevPage">
                        Nyuma
                    </button>

                    <button v-for="page in pageNumbers" :key="page" type="button"
                        class="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors"
                        :class="page === currentPage
                            ? 'border-oceanBlue bg-oceanBlue text-white'
                            : 'border-gray-200 bg-white text-gray-700'
                            " @click="goToPage(page)">
                        {{ page }}
                    </button>

                    <button type="button"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="currentPage === totalPages" @click="nextPage">
                        Mbele
                    </button>
                </div>
            </template>
        </section>
    </NuxtLayout>
</template>
