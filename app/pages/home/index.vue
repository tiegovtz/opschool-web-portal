<script setup lang="ts">
import HeroSection from "~/components/home/HeroSection.vue";
import TopicCard from "~/components/home/TopicCard.vue";
import TabBar from "~/components/home/TabBar.vue";
import LoadingIndicator from "~/components/loading/loadingIndicator.vue";
import { ref, computed, onMounted, watch } from "vue";
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  screenWidth,
} from "@/utilities/controlls";
import InputsSelection from "~/components/home/InputsSelection.vue";
import apiDocs from "~/utilities/apiDocs";
import {
  filterKeyDataFromArrayOfJson,
  removeDataFromArrayOfJson,
} from "~/utilities/filterJson";
import customGridOne from "~/components/home/customGridOne.vue";
import customGridTwo from "~/components/home/customGridTwo.vue";
import DropDownMenu from "~/components/customDropDown/dropDownMenu.vue";
import SubjectCard from "~/components/home/SubjectCard.vue";
import { layoutEffect } from "~/utilities/controlls";
import { fetchAsyncData } from "~/composables/useAsyncFetch";
import type { User } from "~/types/user.interface";
import type { Subjects } from "~/types/subject.interface";
import type { tabs } from "~/types/types.data";
import type { GroupedData } from "~/types/grouped.data";
import type { Experiment } from "~/types/experiment.interface";
import type { Videos } from "~/types/video.interface";
import type { Audios } from "~/types/audio.interface";
import type { Topic } from "~/types/topic.interface";
import { getTabLabel } from "~/utilities/get.labels";

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
let tab = route.query?.tab as tabs;
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
const subjectId = ref(); // Initial subjectId Value State
const seeMoreDetails = ref<string | null>((route.query?.subject as string)?.toLowerCase() ?? null); // Initial See More
const announcement = ref<string>();

// Define Filters Reactive State
const filters = reactive<{ level: number | string | null; subject: string | null }>({
  level: null,
  subject: null,
});

// loadoing indicator
const { progress, isLoading } = useLoadingIndicator();

// Checking Tab if is corresponde to route
if (tab) {
  if (tab == "learn-activities") activeTab.value = "learn-activities";
  if (tab == "video") activeTab.value = "video";
  if (tab == "class-videos") activeTab.value = "class-videos";
  if (tab == "audio")activeTab.value = "audio";
  if (tab == "interactive-contents")activeTab.value = "interactive-contents";
}

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



// Then, update fetchData to call sliceData after data is loaded
const fetchData = async (params?: any) => {
  let url: string;
  data.value = [];
  status.value = "pending";
  error.value = null;
  const tab = activeTab.value;

  if (userToken.value) {
    // Check for specific tabs
    if (tab === "learn-activities") {
      url = apiDocs.experiments.getPublicExperiments;
      params = {
        ...params,
      };
    } else if (tab === "video") {
      url = apiDocs.videos.getPublicVideo;
      params = {
        ...params,
        videoType: "Conceptual",
      };
    } else if (tab === "class-videos") {
      url = apiDocs.videos.getPublicVideo;
      params = {
        ...params,
        videoType: "others",
      };
    } else if (tab === "subjects") {
      url = apiDocs.subjects.getPublicSubjects;
      params = {
        ...params,
      };
    } else if (tab === "interactive-contents") {
      url = apiDocs.topics.filterTopics;
      params = {
        ...params,
        userId: (userToken.value as unknown as User)?._id,
      };
    }
    else if (tab === "audio") {
      url = apiDocs.audio.getPublicAudio;
      params = {
        ...params,
        // audioType: "",
      };

    }

    // Subject-specific tab overrides
    if (subjectId.value) {
      if (tab === "learn-activities") {
        url = apiDocs.experiments.getPublicExperimentsBySubjectId.replace(
          "{subjectId}",
          subjectId.value
        );

        params = {
          ...params,
        };
      } else if (tab === "video") {
        url = apiDocs.videos.getPublicVideoBySubjectId.replace(
          "{subjectId}",
          subjectId.value
        );

        params = {
          ...params,
          videoType: "Conceptual",
        };
      } else if (tab === "class-videos") {
        url = apiDocs.videos.getPublicVideoBySubjectId.replace(
          "{subjectId}",
          subjectId.value
        );

        params = {
          ...params,
          videoType: "Others",
        };
      } else if (tab === "interactive-contents") {
        url = apiDocs.topics.getSubjectId.replace(
          "{subjectId}",
          subjectId.value
        );
        params = {
          ...params,
          userId: (userToken.value as unknown as User)?._id,
        };
      }
      else if (tab === "audio") {
        url = apiDocs.audio.getPublicAudioBySubjectId.replace(
          "{subjectId}",
          subjectId.value
        );
        params = {
          ...params,
          // audioType: "",
        };
      }
    }
  } else {
    if (params) {
      url = apiDocs.topics.filterTopics;
    } else {
      url = apiDocs.subjects.getPublicSubjects;
    }
  }

  try {
    announcement.value = `loading  ${getTabLabel(activeTab.value)} please wait.`;
    const { data: response, status: fetchStatus } = await fetchAsyncData(`tab-${tab}-${subjectId.value ? subjectId.value : ''}`, () => $fetch(url, {
      params: {
        ...params,
      },
      headers: {
        Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
      },
    }));


    // Call State Define above
    if (subjectId.value) {
      data.value = removeDataFromArrayOfJson(response.value, "isDeleted", true);
    } else if (!subjectId.value && tab !== "subjects") {
      data.value = filterKeyDataFromArrayOfJson(response.value, "subject.name", [
        "physics",
        "chemistry",
        "mathematics",
        "biology",
        "geography",
      ]);
    } else {
      data.value = removeDataFromArrayOfJson(response.value, "isDeleted", true);
    }

    status.value = fetchStatus.value;

    // Call sliceData after data is loaded
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );

    announcement.value = ` ${response.value?.length} ${getTabLabel(activeTab.value)} found ready for preview`;
  } catch (err) {
    status.value = "error";
    error.value = err;
    announcement.value = `Error occured while fetching ${getTabLabel(activeTab.value)}`;
  }
};

// Call Fetch Topics function
fetchData();

// shuffle Subject
const shuffleSubject = (subjects: Subjects[]) => {
  return subjects
    .map((subject: Subjects) => ({ subject, sort: Math.random() })) // Assign a random sort key
    .sort((a: any, b: any) => a.sort - b.sort) // Sort by random key
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

const level = ref(); // Initial Level State

// watch emits changes
watch(filters, (newFilters) => {
  if (newFilters.level !== null && newFilters.subject !== null) {
    fetchData({
      level: newFilters.level?.toString(),
      subject: newFilters.subject.toString(),
    });
  }
});

// Call sliceData after data is loaded
sliceData(
  (currentPage.value - 1) * pageSize.value,
  currentPage.value * pageSize.value
);

// watch current tab
watch(
  () => activeTab.value,
  (activeTab) => {
    if (activeTab) {
      seeMoreDetails.value = null;
      if (activeTab === "subjects") {
        subjectId.value = "";
        fetchData();
      } else if (activeTab === "interactive-contents") {
        fetchData();
      } else if (activeTab === "learn-activities") {
        fetchData();
      } else if (activeTab === "video") {
        fetchData();
      } else if (activeTab === "class-videos") {
        fetchData();
      } else if (activeTab === "audio") {
        fetchData();
      }
      else {
        data.value = [];
      }
    }

    // clear filter value on tab change
    filterValue.value = {};
  }
);

// Watch User Token
watch(
  () => userToken.value,
  (userToken) => {
    if (userToken == null || userToken == undefined) {
      activeTab.value = "subjects";
      layoutEffect.value = "grid";
      fetchData();
    }
  }
);

// Watch Filter Value
watch(
  () => filterValue.value,
  (newfilterValue) => {
    if (Object.keys(newfilterValue).length > 0) {
      // Remove empty or falsy values
      const filteredParams = Object.fromEntries(
        Object.entries(newfilterValue).filter(([_, v]) => v)
      );
      fetchData(filteredParams);
      data.value = [];
    } else {
      // Call sliceData after data is loaded
      fetchData();
    }
  }
);

// watch Subject Id
watch(
  () => subjectId.value,
  (valueId) => {
    if (valueId) {
      activeTab.value = "interactive-contents";
    }
  }
);

// switch tabs 
const switchTab = async (tab: tabs) => {
  if (!tab) return;

  activeTab.value = tab;
};

</script>

<template>
  <NuxtLayout name="home-layout">
    <!-- User Has a Token -->
    <section v-if="userToken" :class="[' ', { ' animate-pulse': isLoading }]">
      <HomeSearchbar appearance="rounded" />
      <TabBar :is-logged-in="true" @emit-active-tab="switchTab($event)" :active-tab="activeTab" />

      <!-- container filter Mobile -->
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
        <div v-if="activeTab !=='subjects'" :class="[
          'fixed top-0 left-0 h-full w-full flex flex-col items-start justify-center transition-all duration-700 ease-in-out bg-black/40',
          hideFilter ? 'z-30' : '-z-30',
        ]">
          <div class="w-full h-full bg-white md:w-80">
            <!-- Close Button -->
            <div class="flex items-center justify-end">
              <button class="flex items-center justify-center w-10 h-10 p-2 cursor-pointer rounded-bl-md bg-deepBlue"
                @click="hideFilter = !hideFilter" aria-label="Close filters">
                <Icon name="formkit:close" size="24" class="font-bold text-white" aria-hidden="true" />
              </button>
            </div>

            <div class="flex flex-col gap-4 mt-10">
              <!-- Home Drop Down Menu -->
              <DropDownMenu :active-tab="activeTab" @emit-update-filter-value="filterValue = $event" />
            </div>
          </div>
        </div>
      </div>
      <!-- LayoutEffect  -->
      <div class="items-center justify-end hidden gap-2 md:flex" role="group" aria-label="Layout options">
        <button @click="layoutEffect = 'grid'" :aria-pressed="layoutEffect === 'grid'" aria-label="Grid layout" :class="[
          'cursor-pointer transition-all duration-500 ease-in-out',
          layoutEffect == 'grid' ? '!text-darkBlue' : 'text-oceanBlue',
        ]">
          <Icon name="bxs:grid-alt" size="1.5rem" aria-hidden="true" />
        </button>
        <button @click="layoutEffect = 'list'" :aria-pressed="layoutEffect === 'list'" aria-label="List layout" :class="[
          'text-oceanBlue cursor-pointer transition-all duration-500 ease-in-out',
          layoutEffect == 'list' ? '!text-darkBlue' : 'text-oceanBlue',
        ]">
          <Icon name="fa-solid:list" size="1.5rem" aria-hidden="true" />
        </button>
      </div>
      <div class="flex items-center justify-center w-full gap-4 xl:items-start">
        <!-- container filter Desktop -->
        <div v-if="activeTab !=='subjects'"  aria-label="Filters" role="group"
          class="sticky flex-col items-start hidden w-1/4 p-2 pb-4 my-5 bg-white rounded-md xl:flex top-10 custom-box-shadow">
          <!-- Home Drop Down Menu -->
          <DropDownMenu @emit-update-filter-value="filterValue = $event" :active-tab="activeTab" :filter-value="[]" />

          <!-- <HomeDropFilters :filter-data="keys" @emit-update-filter-value="filterValue = $event" /> -->
        </div>

        <!-- data are in Grid -->
        <div  :class="['w-full ',activeTab !=='subjects'?'xl:w-3/4':'']"  id="main-container" aria-label="content list" role="region" tabindex="-1">
          <div v-if="status === 'pending'" class="flex flex-col items-center justify-center">
            <LoadingIndicator :is-loading="true" />
          </div>
          <!-- Status Error -->
          <div v-else-if="status === 'error'" class="md:min-h-[342px] flex flex-col justify-center items-center"
            role="alert">
            <Icon name="codicon:errorr" class="mb-4 text-red-500" size="20" aria-hidden="true" />
            <p class="text-center">
              Oops! Something went wrong.<br />
              Try refreshing the page or check your internet connection.
            </p>

            <button v-if="
              (Array.isArray(filterValue) && filterValue.length > 0) ||
              (typeof filterValue == 'object' &&
                Object.keys(filterValue).length > 0)" @click="filterValue = []" class="cursor-pointer text-oceanBlue"
              aria-label="Reset filters">
              Reset filters
            </button>
          </div>

          <!-- Status Success -->
          <div
            v-else-if="status == 'success' && subjectId && data && data.length > 0">
            <ClientOnly>
              <customGridOne active-tab="subjects" v-if="activeTab === 'subjects'">
                <template #data>
                  <!-- Subject Cards are in Grid -->
                  <SubjectCard v-for="subject in shuffleSubject(slicedData)" :key="subject._id"
                    :subject-id="subject._id" :subject-name="subject.name" :subject-image="subject.thumbnail"
                    :subject-description="subject.description" :total-views="subject.views ?? 0"
                    :is-logged-in="userToken != null || userToken != undefined" @emit-subject-name="activeTab = $event"
                    @emit-subject-id="subjectId = $event" 
                    :alt-text="subject.alt"/>
                </template>
              </customGridOne>

              <customGridOne v-else-if="activeTab === 'interactive-contents'">
                <template #data>
                  <!-- Topic Cards are in Grid -->
                  <TopicCard v-for="topic in slicedData" :key="topic._id" :topic-id="topic._id"
                    :topic-image="topic.thumbnail" :topic-title="topic.name" :topic-description="topic.descriptions"
                    :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'"
                    :topic-likes="topic.topic_likes ? topic.topic_likes : 100" :topic-level="level"
                    :topic-standard="topic.level?.name" :subject-name="topic.subject?.name"
                    :topic-viewed="topic.isViewed" :topic-progress="topic.avgProgress"
                    :topic-views="topic.viewedBy?.length ? topic.viewedBy?.length : topic.views ? topic.views : 0"
                    :alt-text="topic.alt" />
                </template>
              </customGridOne>

              <customGridOne v-else-if="activeTab === 'learn-activities'">
                <template #data>
                  <!-- Experiment Cards are in Grid -->
                  <ExperimentsCard v-for="experiment in slicedData" :key="experiment._id"
                    :experiment-id="experiment._id" :experiment-thumbnail="experiment.thumbnail"
                    :experiment-title="experiment.title" :experiment-description="experiment.description"
                    :experiment-type="experiment.category" :experiment-subject="experiment.subject?.name"
                    :experiment-level="experiment.level?.name" :experiment-name="experiment.name"
                    :experiment-file-url="experiment.stepsFileUrl" 
                    :alt-text="experiment.alt"
                    />
                </template>
              </customGridOne>

              <customGridOne v-else-if="
                activeTab === 'video' ||
                activeTab === 'class-videos'
              ">
                <template #data>
                  <!-- Video Cards are in Grid -->
                  <VideoCard v-for="video in slicedData" :key="video._id" :video-id="video._id" :video-name="video.name"
                    :video-thumbnail="video.thumbnail" :video-file-url="video.videoFileUrl"
                    :is-deleted="video.isDeleted" :video-description="video.description"
                    :video-subject="video.subject?.name" :video-type="video.videoType"
                    :video-level="level" :video-standard="video.level?.name"
                    :topic-progress="video.avgProgress" :topic-viewed="video.isViewed" 
                    :alt-text="video.alt"/>
                </template>
              </customGridOne>
              <div v-else-if="activeTab === 'audio'">
                <MessageTopicNotFound message="This page will be updated soon" />
              </div>
            </ClientOnly>

            <!-- pagination numbers based on data length greater to 9 -->
            <div v-if="totalPages > 1" class="flex justify-center my-5">
              <div v-if="totalPages <= 5" class="flex justify-center gap-2">
                <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                  :is-active="page === currentPage" :disabled="page === currentPage"
                  @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />
              </div>
              <div v-else class="flex items-center gap-2">
                <div class="flex items-center justify-center" v-if="currentPage > 5">
                  <Icon name="iconamoon:arrow-left-2-fill" size="2rem" @click="prevPage" />
                </div>

                <div class="overflow-x-scroll scrollbar-none max-w-[250px] flex items-center justify-start gap-2">
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

            <!-- <PaginationSliderBtn  v-if="totalPages > 1"
                  :pages="totalPages" :current-page="currentPage"
                  @send-slider-page-number="currentPage = $event"
                  @sendSliderCurrentPageNumber="sliceData(($event - 1) * pageSize, $event * pageSize)"
                /> -->
          </div>

          <!-- data sorted if no subject -->
          <div v-else-if="status == 'success' && !subjectId && data && data.length > 0">
            <ClientOnly>
              <HomeCustomScrollView :shuffle-subject="shuffleSubject" :see-more-details="seeMoreDetails?.toString()"
                :data="data" :active-tab="activeTab" @emittedSubjectId="subjectId = $event"
                @emittedActiveTab="activeTab = $event" />
            </ClientOnly>
          </div>
          <MessageTopicNotFound v-else />
        </div>
      </div>
    </section>

    <!-- User has no token -->
    <section v-else :class="[' ', { ' animate-pulse': isLoading }]">
      <HeroSection />
      <InputsSelection @emit-level="level = $event" @emit-standard="filters.level = $event"
        @emit-subject="filters.subject = $event" />
      <TabBar />

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
                  :topic-image="topic.thumbnail" :topic-title="topic.name" :topic-description="topic.descriptions"
                  :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'
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
                <SubjectCard v-for="subject in shuffleSubject(slicedData)" :key="subject._id" :subject-id="subject._id"
                  :subject-name="subject.name" :subject-image="subject.thumbnail"
                  :subject-description="subject.description" :total-views="subject.views ?? 0"
                  :is-logged-in="userToken != null || userToken != undefined" @emit-subject-name="activeTab = $event" />
              </template>
            </customGridTwo>

            <!-- pagination numbers based on data length greater to 9 -->
            <div v-if="totalPages > 1" class="flex justify-center my-5">
              <div v-if="totalPages <= 5" class="flex justify-center gap-2">
                <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                  :is-active="page === currentPage" :disabled="page === currentPage"
                  @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />
              </div>
              <div v-else class="flex justify-center gap-2">
                <!-- previous -->
                <div class="flex items-center justify-center" v-if="currentPage > 5">
                  <Icon name="iconamoon:arrow-left-2-fill" size="2rem" @click="prevPage" />
                </div>

                <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                  :is-active="page === currentPage" :disabled="page === currentPage"
                  @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />

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

    <!-- announcement -->
    <!-- screen reader notifier -->
    <!-- <div class="sr-only" aria-live="assertive" aria-atomic role="status">
      {{ announcement }}
    </div> -->
  </NuxtLayout>
</template>
