<script setup>
import HeroSection from "@/components/home/HeroSection.vue";
import TopicCard from "@/components/home/TopicCard.vue";
import TabBar from "@/components/home/TabBar.vue";
import { filterContentBySearch } from "@/utilities/filterJson.ts";
import { ref, computed, onMounted, watch } from "vue";
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  screenWidth,
} from "@/utilities/controlls";
import InputsSelection from "@/components/home/InputsSelection.vue";
import apiDocs from "~/utilities/api-docs";
import { extractNestedKeysAndValues } from "~/utilities/filterJson";

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

// Define Ref state
const error = ref(); // Initial Error State
const status = ref("pending"); // Initial Status State
const data = ref([]); // Initial Topics State
const slicedData = ref(); // Initial slice data to 9
const hideFilter = ref(false); // Initial Hide Filters
const activeTab = ref("home"); // Initial Active Tab State
const filterValue = ref(); // Initial Filter Value State
const keys = ref()

// First, fix the sliceData function
const sliceData = (start, end) => {
  if (
    !data ||
    !Array.isArray(data.value) ||
    data.value.length === 0
  ) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (
    data.value?.length <= pageSize.value
  ) {
    slicedData.value = data.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value =
    data.value?.slice(start, end);
};

// current page data
const currentPage = ref(1);
const pageSize = ref();

// Then, update fetchData to call sliceData after data is loaded
const fetchData = async (params) => {
  let url = userToken.value
    ? apiDocs.topics.filterTopicsByUser.replace(
        "{userId}",
        userToken.value?._id
      )
    : apiDocs.topics.filterTopics;

  // Experiments
  activeTab.value.toLowerCase() == "experiments"
    ? (url = apiDocs.experiments.getExperiments)
    : "";

  // Video
  activeTab.value.toLowerCase() == "video"
    ? (url = apiDocs.videos.getVideos)
    : "";

  // Home
  activeTab.value.toLowerCase() == "home"
      ? (url = apiDocs.subjects.getPublicSubjects)
      : "";

  // activeTab.value.toLowerCase() = 'audio' ? url = apiDocs.experiments:''

  try {
    status.value = "pending";
    const response = await $fetch(url, {
      params: params,
      headers: {
        Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
      },
    });

    // Call State Define above
    data.value = response;
    status.value = "success";

    // Call sliceData after data is loaded
    keys.value = extractNestedKeysAndValues(data.value);
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );
  } catch (err) {
    status.value = "error";
    error.value = err
    sendRedirect("/auth", 301);
  }
};

// Call Fetch Topics function
fetchData({});

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

// loadoing indicator
const { progress, isLoading } = useLoadingIndicator();

// Define Filters Reactive State
const filters = reactive({
  level: null,
  subject: null,
});

const level = ref(); // Initial Level State

// watch emits changes
watch(filters, (filters) => {
  fetchData({
    level: filters.level.toString(),
    subject: filters.subject.toString(),
  });
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
      if (activeTab.toLowerCase() === "home") {
        fetchData({});
      } else if (activeTab.toLowerCase() === "interactive books") {
        fetchData({});
      } else if (activeTab.toLowerCase() === "experiments") {
        fetchData({});
      } else if (activeTab.toLowerCase() === "video") {
        fetchData({});
      } else if (activeTab.toLowerCase() === "audio") {
        fetchData({});
      }
    }
  }
);

// Watch User Token
watch(
  () => userToken.value,
  (userToken) => {
    if (userToken == null || userToken == undefined) {
      activeTab.value = "home";
      fetchData({});
    }
  }
);

// Watch Filter Value
watch(
  () => filterValue.value,
  (filterValue) => {
    if (filterValue) {
      slicedData.value = filterContentBySearch(data.value, filterValue);
    }else {
    // Call sliceData after data is loaded
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );
    }
  }
);
</script>

<template>
  <NuxtLayout name="home-layout">
    <section :class="['wrapper-container', { ' animate-pulse': isLoading }]">
      <!-- User Token Available -->
      <div
        v-if="userToken"
        class="flex flex-col items-center justify-center w-full pt-4 gap-4"
      >
        <HomeSearchbar appearance="rounded" />
        <TabBar :is-logged-in="true" @emit-active-tab="activeTab = $event" />
      </div>

      <!-- User Token Not Available -->
      <div v-else>
        <HeroSection />
        <InputsSelection
          @emit-level="level = $event"
          @emit-standard="filters.level = $event"
          @emit-subject="filters.subject = $event"
        />
        <TabBar />
      </div>

      <div
        v-if="status === 'pending'"
        class="flex flex-col justify-center items-center"
      >
        <LoadingIndicator :is-loading="true" />
      </div>
      <!-- Status Error -->
      <div v-else-if="status === 'error'">Error: {{ error?.message }}</div>

      <!-- Status Success -->
      <div v-else-if="status == 'success'" class="">
        <!-- client only -->
        <ClientOnly v-if="data.length > 0">
          <div class="w-full flex flex-col">
            <!-- container filter Mobile -->
            <div class="flex xl:hidden justify-between items-center py-2">
              <p class="text-small font-medium">
                Viewing {{ data?.length }} Results
              </p>
              <div
                class="flex items-center gap-2 text-deepBlue cursor-pointer"
                @click="hideFilter = !hideFilter"
              >
                <Icon name="mage:filter-fill" size="24" class="" />
                <p class="text-medium">Filters</p>
              </div>

              <!-- Side Bar Container Filter For Mobile View Only -->
              <div
                :class="[
                  'fixed top-0 left-0 h-full w-full flex flex-col items-start justify-center transition-all duration-700 ease-in-out bg-black/40',
                  hideFilter ? 'z-30' : '-z-30',
                ]"
              >
                <div class="bg-white h-full md:w-80 w-full">
                  <!-- Close Button -->
                  <div class="flex justify-end items-center">
                    <button
                      class="p-2 cursor-pointer h-10 w-10 rounded-bl-md bg-deepBlue flex items-center justify-center"
                      @click="hideFilter = !hideFilter"
                    >
                      <Icon
                        name="formkit:close"
                        size="24"
                        class="text-white font-bold"
                      />
                    </button>
                  </div>

                  <div class="flex flex-col mt-10 gap-4">
                    <h2 class="text-medium font-bold tracking-wider px-3 py-2">
                      Filters
                    </h2>
                    <!-- Home Drop Down Menu -->
                    <HomeDropDownMenu
                      :active-tab="activeTab"
                      @emit-update-filter-value="filterValue = $event"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <!-- container filter Desktop -->
              <div
                class="sticky top-10 z-10 xl:flex hidden flex-col items-start my-5 w-1/4 rounded-md p-2 pb-4 bg-white custom-box-shadow"
                v-if="userToken"
              >
                <h2 class="text-medium font-bold tracking-wider px-3 py-2">
                  Filters
                </h2>
                <!-- Home Drop Down Menu -->
                <HomeDropDownMenu
                  @emit-update-filter-value="filterValue = $event"
                  :active-tab="activeTab"
                  :filter-value="[]"
                />

                <!-- <HomeDropFilters :filter-data="keys" @emit-update-filter-value="filterValue = $event" /> -->
              </div>
              <!-- Topic Cards are in Grid -->
              <div
                :class="[
                  'flex flex-col items-center container',
                  userToken ? 'xl:w-3/4' : 'w-full',
                ]"
              >
                <div
                  :class="[
                    '!grid md:grid-cols-2 grid-cols-1 gap-4 my-5',
                    userToken
                      ? '3xl:grid-cols-4 2xl:grid-cols-3'
                      : '3xl:grid-cols-5 2xl:grid-cols-4 xl:grid-cols-3',
                  ]"
                  v-if="activeTab.toLowerCase() === 'home'"
                >
                  <!-- Subject Cards are in Grid -->
                  <HomeSubjectCard
                    v-for="subject in slicedData"
                    :key="subject._id"
                    :subject-id="subject._id"
                    :subject-name="subject.name"
                    :subject-image="subject.thumbnail"
                    :total-views="subject.total_views"
                    :is-logged-in="userToken != null || userToken != undefined"
                    @emit-subject-name="activeTab = $event"
                  />
                </div>
                <div
                  v-else-if="
                    activeTab.toLowerCase() === 'interactive books' && userToken
                  "
                   :class="[
                    '!grid md:grid-cols-2 grid-cols-1 gap-4 my-5',
                    userToken
                      ? '3xl:grid-cols-4 2xl:grid-cols-3'
                      : '3xl:grid-cols-5 2xl:grid-cols-4 xl:grid-cols-3',
                  ]"
                >
                  <!-- Topic Cards are in Grid -->
                  <TopicCard
                    v-for="topic in slicedData"
                    :key="topic._id"
                    :topic-id="topic._id"
                    :topic-image="topic.thumbnail"
                    :topic-title="topic.name"
                    :topic-description="topic.descriptions"
                    :topic-duration="
                      topic.topic_duration ? topic.topic_duration : '10 min'
                    "
                    :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
                    :topic-views="topic.views ? topic.views : 0"
                    :topic-level="level"
                    :topic-standard="topic.level.name"
                    :subject-name="topic.subject.name"
                    :topic-viewed="topic.isViewed"
                    :topic-progress="topic.progressPercent"
                  />
                </div>
                <div
                  v-else-if="
                    activeTab.toLowerCase() === 'experiments' && userToken
                  "
                   :class="[
                    '!grid md:grid-cols-2 grid-cols-1 gap-4 my-5',
                    userToken
                      ? '3xl:grid-cols-4 2xl:grid-cols-3'
                      : '3xl:grid-cols-5 2xl:grid-cols-4 xl:grid-cols-3',
                  ]"
                >
                  <ExperimentsCard
                    v-for="experiment in slicedData"
                    :key="experiment._id"
                    :experiment-id="experiment._id"
                    :experiment-thumbnail="experiment.thumbnail"
                    :experiment-title="experiment.title"
                    :experiment-description="experiment.description"
                    :experiment-type="experiment.category"
                    :experiment-subject="experiment.subject.name"
                    :experiment-level="experiment.level.name"
                    :experiment-name="experiment.name"
                    :experiment-file-url="experiment.stepsFileUrl"
                  />
                </div>
                <div
                  v-else-if="activeTab.toLowerCase() === 'video' && userToken"
                   :class="[
                    '!grid md:grid-cols-2 grid-cols-1 gap-4 my-5',
                    userToken
                      ? '3xl:grid-cols-4 2xl:grid-cols-3'
                      : '3xl:grid-cols-5 2xl:grid-cols-4 xl:grid-cols-3',
                  ]"
                >
                  <!-- Video Cards are in Grid -->
                  <VideoCard
                    v-for="video in slicedData"
                    :key="video._id"
                    :video-id="video._id"
                    :video-name="video.name"
                    :video-thumbnail="video.thumbnail"
                    :video-file-url="video.videoFileUrl"
                    :video-description="video.description"
                    :video-subject="video.subject.name"
                    :video-type="video.videoType"
                  />
                </div>
                <div
                  v-else-if="activeTab.toLowerCase() === 'audio' && userToken"
                  class="!grid 3xl:grid-cols-4 xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 my-5"
                >
                  <MessageTopicNotFound />
                </div>
              </div>
            </div>

            <!-- pagination numbers based on data length greater to 9 -->
            <div class="flex justify-center my-5">
              <div v-if="totalPages <= 5" class="flex justify-center gap-2">
                <PaginationBtn
                  v-for="page in totalPages"
                  :key="page"
                  :page-number="page"
                  :is-active="page === currentPage"
                  :disabled="page === currentPage"
                  @click="sliceData((page - 1) * pageSize, page * pageSize)"
                  @send-page-number="currentPage = $event"
                />
              </div>
              <div v-else class="flex justify-center gap-2">
                <!-- previous -->
                <div
                  class="flex justify-center items-center"
                  v-if="currentPage > 5"
                >
                  <Icon
                    name="iconamoon:arrow-left-2-fill"
                    size="2rem"
                    @click="prevPage"
                  />
                </div>

                <PaginationBtn
                  v-for="page in totalPages"
                  :key="page"
                  :page-number="page"
                  :is-active="page === currentPage"
                  :disabled="page === currentPage"
                  @click="sliceData((page - 1) * pageSize, page * pageSize)"
                  @send-page-number="currentPage = $event"
                />

                <!-- next button -->
                <div
                  class="flex justify-center items-center"
                  v-if="currentPage > 4"
                >
                  <Icon
                    name="iconamoon:arrow-right-2-fill"
                    size="2rem"
                    @click="nextPage"
                  />
                </div>
              </div>
            </div>
          </div>
        </ClientOnly>
        <MessageTopicNotFound v-else />
      </div>

      <!-- Even Data was not success should be handle here -->
      <div class="w-full flex flex-col" v-else>
        <p class="text-center text-medium">
          Try to refresh the page, Something went Wrong
        </p>
      </div>
    </section>
  </NuxtLayout>
</template>
