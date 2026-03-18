<script lang="ts" setup>
import HeroSection from '~/components/home/HeroSection.vue';
import InputsSelection from '~/components/home/InputsSelection.vue';
import TabBar from '~/components/home/TabBar.vue';
import type { Audios } from '~/types/audio.interface';
import type { Experiment } from '~/types/experiment.interface';
import type { GroupedData } from '~/types/grouped.data';
import type { Subjects } from '~/types/subject.interface';
import type { Topic } from '~/types/topic.interface';
import type { tabs } from '~/types/types.data';
import type { Videos } from '~/types/video.interface';
import { isGreaterToLG, isGreaterToMD, isGreaterToXL, layoutEffect, screenWidth } from '~/utilities/controlls';

// Define meta info about page
useHead({
    title: "TIE - Tanzania Interactive Learning Platform",
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

// Define Cookie
const userToken = useCookie("signInUserToken");
const route = useRoute();
const router = useRouter();
// current page data
const currentPage = ref<number>(1);
const pageSize = ref<number>(12);

// Define Ref state
const error = ref(); // Initial Error State
const status = ref<string | null>("pending"); // Initial Status State
const data = ref<any[] | GroupedData<Subjects>[] | GroupedData<Experiment>[] | GroupedData<Videos>[] | GroupedData<Audios>[] | GroupedData<Topic>[]>(); // Initial Topics State
const slicedData = ref(); // Initial slice data to 9
const hideFilter = ref(false); // Initial Hide Filters
const activeTab = ref<tabs>("subjects"); // Initial Active Tab State
const filterValue = ref(); // Initial Filter Value State
const subjectId = ref<string>(""); // Initial subjectId Value State
const subjectSlug = ref<string>(""); // Initial subject slug Value State
const subjectName = ref<string>(""); // Initial subject name Value State
const seeMoreDetails = ref<string | null>(null); // Initial See More
const announcement = ref<string>();

const TAB_TO_ROUTE: Record<tabs, { path: string; query?: Record<string, any> }> = {
  subjects: { path: "/home" },
  "interactive-contents": { path: "/interactive" },
  "learn-activities": { path: "/experiments" },
  video: { path: "/video", query: { type: "conc" } },
  "class-videos": { path: "/video", query: { type: "oth" } },
  audio: { path: "/audio" },
  "smart-class": { path: "/smart-class" },
};    

const isSubjectDetail = computed(
  () =>
    activeTab.value === "subjects" &&
    (!!subjectId.value || !!subjectSlug.value)
);

const displayTab = computed<tabs>(() =>
  isSubjectDetail.value ? "interactive-contents" : activeTab.value
);

// First, fix the sliceData function
const sliceData = (start: number, end: number) => {
  if (!data || !Array.isArray(data.value) || data.value.length === 0) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (data.value?.length <= pageSize.value) {
    slicedData.value = data.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value = data.value?.slice(start, end);
};

// shuffle Subject
const shuffleSubject = (subjects: Subjects[]) => {
  return subjects
    .map((subject: Subjects) => ({ subject, sort: Math.random() })) // Assign a random sort key
    .sort((a: any, b: any) => a.name - b.name) // Sort by random key
    .map(({ subject }: { subject: Subjects }) => subject); // Extract shuffled choices
};

//  assigning page size based on screen sizes
if (isGreaterToXL) {
  pageSize.value = 12; // 12 topic cards
} else if (isGreaterToLG) {
  pageSize.value = 9; // 9 topic cards
} else if (isGreaterToMD) {
  pageSize.value = 6; // 6 topic cards per page
} else {
  pageSize.value = 4; // 4 topics card per page
}

// total pages data
const totalPages = computed(() => {
  if (data && Array.isArray(data.value)) {
    return Math.ceil(data.value?.length / pageSize.value);
  }
  return 0; // Default to 0 if no data
});

// Watch screen width and update page size accordingly
watch(
  () => screenWidth.value,
  () => {
    if (screenWidth.value >= 1280) {
      pageSize.value = 12;
    } else if (screenWidth.value >= 1024 && screenWidth.value < 1280) {
      pageSize.value = 9;
    } else if (screenWidth.value >= 768 && screenWidth.value < 1024) {
      pageSize.value = 6;
    } else if (screenWidth.value >= 640 && screenWidth.value < 768) {
      pageSize.value = 4;
    } else {
      pageSize.value = 4;
    }

    // slice data per page size
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );
  }
);

// once pages are more than 5, handle pagination
const nextPage = () => {
  currentPage.value++;
  currentPage.value =
    currentPage.value > totalPages.value ? totalPages.value : currentPage.value;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
};

const prevPage = () => {
  currentPage.value--;
  currentPage.value = currentPage.value < 1 ? 1 : currentPage.value;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
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
  await router.push(target);
};

const slugifySubject = (value: string) =>
  value ? value.toLowerCase().trim().replace(/\s+/g, "-") : "";

const getSubjectRoute = (id?: string, slug?: string) => {
  if (slug && id) return { path: `/interactive/${slug}/${id}` };
  if (slug) return { path: `/interactive/${slug}` };
  if (id) return { path: `/interactive/${id}` };
  return { path: "/interactive" };
};

const handleSubjectSelect = async (id: string, name: string) => {
  subjectId.value = id;
  subjectName.value = name;
  subjectSlug.value = slugifySubject(name);
  activeTab.value = "subjects";
  const target = getSubjectRoute(id, subjectSlug.value);
  await router.push(target);
};

// Define Filters Reactive State
const level = ref(); // Initial Level State

const filters = reactive<{ level: number | string | null; subject: string | null }>({
  level: null,
  subject: null,
});

</script>

<template>
    <nuxt-layout name="home-layout" language="kiswahili">
        <section v-if="userToken">
            <HomeSearchbar appearance="rounded" language="kiswahili" education-level="primary" />
            <!--  @emit-active-tab="switchTab($event)" :active-tab="activeTab"  -->
            <TabBar :is-logged-in="true" />

            <div class="flex items-center justify-between py-2 xl:hidden">
                <ClientOnly>
                    <p class="font-medium text-small" aria-live="polite">Viewing {{ data?.length || 0 }} Results</p>
                </ClientOnly>
                <button class="flex items-center gap-2 cursor-pointer text-deepBlue" @click="hideFilter = !hideFilter"
                    :aria-expanded="hideFilter" aria-label="Toggle filters">
                    <Icon name="mage:filter-fill" size="24" class="" aria-hidden="true" />
                    <p class="text-medium">Filters</p>
                </button>

                <!-- Side Bar Container Filter For Mobile View Only -->
                <div v-if="displayTab !== 'subjects'" :class="[
                    'fixed top-0 left-0 h-full w-full flex flex-col items-start justify-center transition-all duration-700 ease-in-out bg-black/40',
                    hideFilter ? 'z-30' : '-z-30',
                ]">
                    <div class="w-full h-full bg-white md:w-80">
                        <!-- Close Button -->
                        <div class="flex items-center justify-end">
                            <button
                                class="flex items-center justify-center w-10 h-10 p-2 cursor-pointer rounded-bl-md bg-deepBlue"
                                @click="hideFilter = !hideFilter" aria-label="Close filters">
                                <Icon name="formkit:close" size="24" class="font-bold text-white" aria-hidden="true" />
                            </button>
                        </div>

                        <div class="flex flex-col gap-4 mt-10">
                            <!-- Home Drop Down Menu -->
                            <DropDownMenu :active-tab="displayTab" @emit-update-filter-value="filterValue = $event" />
                        </div>
                    </div>
                </div>
            </div>
            <!-- LayoutEffect  -->
            <div class="items-center justify-end hidden gap-2 md:flex" role="group" aria-label="Layout options">
                <button @click="layoutEffect = 'grid'" :aria-pressed="layoutEffect === 'grid'" aria-label="Grid layout"
                    :class="[
                        'cursor-pointer transition-all duration-500 ease-in-out',
                        layoutEffect == 'grid' ? '!text-darkBlue' : 'text-oceanBlue',
                    ]">
                    <Icon name="bxs:grid-alt" size="1.5rem" aria-hidden="true" />
                </button>
                <button @click="layoutEffect = 'list'" :aria-pressed="layoutEffect === 'list'" aria-label="List layout"
                    :class="[
                        'text-oceanBlue cursor-pointer transition-all duration-500 ease-in-out',
                        layoutEffect == 'list' ? '!text-darkBlue' : 'text-oceanBlue',
                    ]">
                    <Icon name="fa-solid:list" size="1.5rem" aria-hidden="true" />
                </button>
            </div>
            <div class="flex items-center justify-center w-full gap-4 xl:items-start">
                <!-- container filter Desktop -->
                <div v-if="displayTab !== 'subjects'" aria-label="Filters" role="group"
                    class="sticky flex-col items-start hidden w-1/4 p-2 pb-4 my-5 bg-white rounded-md xl:flex top-10 custom-box-shadow">
                    <!-- Home Drop Down Menu -->
                    <DropDownMenu @emit-update-filter-value="filterValue = $event" :active-tab="displayTab"
                        :filter-value="[]" />

                    <!-- <HomeDropFilters :filter-data="keys" @emit-update-filter-value="filterValue = $event" /> -->
                </div>

                <!-- data are in Grid -->
                <div :class="['w-full ', displayTab !== 'subjects' ? 'xl:w-3/4' : '']" id="main-container"
                    aria-label="content list" role="region" tabindex="-1">
                    <div v-if="status === 'pending'" class="flex flex-col items-center justify-center">
                        <LoadingIndicator :is-loading="true" />
                    </div>
                    <!-- Status Error -->
                    <div v-else-if="status === 'error'"
                        class="md:min-h-[342px] flex flex-col justify-center items-center" role="alert">
                        <Icon name="codicon:errorr" class="mb-4 text-red-500" size="20" aria-hidden="true" />
                        <p class="text-center">
                            Oops! Something went wrong.<br />
                            Try refreshing the page or check your internet connection.
                        </p>

                        <button v-if="
                            (Array.isArray(filterValue) && filterValue.length > 0) ||
                            (typeof filterValue == 'object' &&
                                Object.keys(filterValue).length > 0)" @click="filterValue = []"
                            class="cursor-pointer text-oceanBlue" aria-label="Reset filters">
                            Reset filters
                        </button>
                    </div>

                    <!-- Status Success -->
                    <div v-else-if="status == 'success' && subjectId && data && data.length > 0">
                        <ClientOnly>
                            <customGridOne active-tab="subjects" v-if="displayTab === 'subjects'">
                                <template #data>
                                    <!-- Subject Cards are in Grid -->
                                    <SubjectCard v-for="subject in shuffleSubject(slicedData)" :key="subject._id"
                                        :subject-id="subject._id" :subject-name="subject.name"
                                        :subject-image="subject.thumbnail" :subject-description="subject.description"
                                        :total-views="subject.views ?? 0"
                                        :is-logged-in="userToken != null || userToken != undefined"
                                        @emit-subject-name="(name:any) => { subjectName = name; subjectSlug = slugifySubject(name); if (subjectId) handleSubjectSelect(subjectId, name); }"
                                        @emit-subject-id="(id:any) => { handleSubjectSelect(id, subjectName || subjectSlug || 'subject'); }"
                                        :alt-text="subject.alt" />
                                </template>
                            </customGridOne>

                            <customGridOne v-else-if="displayTab === 'interactive-contents'">
                                <template #data>
                                    <!-- Topic Cards are in Grid -->
                                    <TopicCard v-for="topic in slicedData" :key="topic._id" :topic-id="topic._id"
                                        :topic-image="topic.thumbnail" :topic-title="topic.name"
                                        :topic-description="topic.descriptions"
                                        :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'"
                                        :topic-likes="topic.topic_likes ? topic.topic_likes : 100" :topic-level="level"
                                        :topic-standard="topic.level?.name" :subject-name="topic.subject?.name"
                                        :topic-viewed="topic.isViewed" :topic-progress="topic.avgProgress"
                                        :topic-views="topic.viewedBy?.length ? topic.viewedBy?.length : topic.views ? topic.views : 0"
                                        :alt-text="topic.alt" />
                                </template>
                            </customGridOne>
                        </ClientOnly>

                        <!-- pagination numbers based on data length greater to 9 -->
                        <div v-if="totalPages > 1" class="flex justify-center my-5">
                            <div v-if="totalPages <= 5" class="flex justify-center gap-2">
                                <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                                    :is-active="page === currentPage" :disabled="page === currentPage"
                                    @click="sliceData((page - 1) * pageSize, page * pageSize)"
                                    @send-page-number="currentPage = $event" />
                            </div>
                            <div v-else class="flex items-center gap-2">
                                <div class="flex items-center justify-center" v-if="currentPage > 5">
                                    <Icon name="iconamoon:arrow-left-2-fill" size="2rem" @click="prevPage" />
                                </div>

                                <div
                                    class="overflow-x-scroll scrollbar-none max-w-[250px] flex items-center justify-start gap-2">
                                    <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                                        :is-active="page === currentPage" :disabled="page === currentPage"
                                        @click="sliceData((page - 1) * pageSize, page * pageSize)"
                                        @send-page-number="currentPage = $event" />
                                </div>

                                <div class="flex items-center justify-center" v-if="currentPage > 4">
                                    <Icon name="iconamoon:arrow-right-2-fill" size="2rem" @click="nextPage" />
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- data sorted if no subject -->
                    <div v-else-if="status == 'success' && data && data.length > 0">
                        <ClientOnly>
                            <HomeCustomScrollView :shuffle-subject="shuffleSubject"
                                :see-more-details="seeMoreDetails?.toString()" :data="data" :active-tab="displayTab"
                                @emittedSubjectId="(id) => { handleSubjectSelect(id, subjectName || subjectSlug || 'subject'); }"
                                @emittedActiveTab="switchTab($event)"
                                @emittedSubjectName="(name) => { subjectName = name; subjectSlug = slugifySubject(name); if (subjectId) handleSubjectSelect(subjectId, name); }" />
                        </ClientOnly>
                    </div>
                    <MessageTopicNotFound v-else />
                </div>
            </div>
        </section>
        <section v-else>
            <HeroSection language="kiswahili" />
            <InputsSelection language="kiswahili" education-level="primary" />
            <!-- @emit-level="level = $event" @emit-standard="filters.level = $event"
        @emit-subject="filters.subject = $event"  -->
            <!-- <TabBar /> -->


            <div v-if="status === 'pending'" class="flex flex-col items-center justify-center">
                <LoadingIndicator :is-loading="true" />
            </div>
            <!-- Status Error -->
            <div v-else-if="status === 'error'" class="md:min-h-[342px] flex flex-col justify-center items-center">
                <Icon name="codicon:errorr" class="mb-4 text-red-500" size="20" />
                <p class="text-center">
                    Oops! Something went wrong.<br />
                    Try refreshing the page or check your internet connection.
                </p>
            </div>

            <!-- Status Success -->
            <div v-else-if="status == 'success'" class="">
                <!-- client only -->
                <ClientOnly v-if="data && data.length > 0">
                    <div id="main-container" tabindex="-1" class="flex flex-col w-full">
                        <customGridTwo v-if="filters.level !== null && filters.subject !== null">
                            <template #data>
                                <!-- Topic Cards -->
                                <TopicCard v-for="topic in slicedData" :key="topic._id" :topic-id="topic._id"
                                    :topic-image="topic.thumbnail" :topic-title="topic.name"
                                    :topic-description="topic.descriptions" :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'
                                        " :topic-likes="topic.topic_likes ? topic.topic_likes : 100" :topic-views="topic.viewedBy?.length
                        ? topic.viewedBy?.length
                        : topic.views
                            ? topic.views
                            : 0
                        " :topic-level="level" :topic-standard="topic.level?.name" :subject-name="topic.subject?.name"
                                    :topic-viewed="topic.isViewed" :topic-progress="topic.avgProgress" />
                            </template>
                        </customGridTwo>

                        <customGridTwo v-else>
                            <template #data>
                                <!-- Subject Cards are in Grid -->
                                <SubjectCard v-for="subject in shuffleSubject(slicedData)" :key="subject._id"
                                    :subject-id="subject._id" :subject-name="subject.name"
                                    :subject-image="subject.thumbnail" :subject-description="subject.description"
                                    :total-views="subject.views ?? 0"
                                    :is-logged-in="userToken != null || userToken != undefined" />
                            </template>
                        </customGridTwo>

                        <!-- pagination numbers based on data length greater to 9 -->
                        <div v-if="totalPages > 1" class="flex justify-center my-5">
                            <div v-if="totalPages <= 5" class="flex justify-center gap-2">
                                <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                                    :is-active="page === currentPage" :disabled="page === currentPage"
                                    @click="sliceData((page - 1) * pageSize, page * pageSize)"
                                    @send-page-number="currentPage = $event" />
                            </div>
                            <div v-else class="flex justify-center gap-2">
                                <!-- previous -->
                                <div class="flex items-center justify-center" v-if="currentPage > 5">
                                    <Icon name="iconamoon:arrow-left-2-fill" size="2rem" @click="prevPage" />
                                </div>

                                <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                                    :is-active="page === currentPage" :disabled="page === currentPage"
                                    @click="sliceData((page - 1) * pageSize, page * pageSize)"
                                    @send-page-number="currentPage = $event" />

                                <!-- next button -->
                                <div class="flex items-center justify-center" v-if="currentPage > 4">
                                    <Icon name="iconamoon:arrow-right-2-fill" size="2rem" @click="nextPage" />
                                </div>
                            </div>
                        </div>
                    </div>
                </ClientOnly>
                <MessageTopicNotFound v-else />
            </div>

            <!-- Even Data was not success should be handle here -->
            <div class="flex flex-col w-full" v-else>
                <p class="text-center text-medium">
                    Try to refresh the page, Something went Wrong
                </p>
            </div>
        </section>
    </nuxt-layout>
</template>
