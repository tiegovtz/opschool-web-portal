<script setup lang="ts">
import TopicCard from "@/components/home/TopicCard.vue";
import TabBar from "@/components/home/TabBar.vue";
import { ref, computed, watch } from "vue";
import type { tabs } from "~/types/types.data";
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  screenWidth,
} from "@/utilities/controlls";
import apiDocs from "~/utilities/apiDocs";
import customGridTwo from "~/components/home/customGridTwo.vue";
import { removeDataFromArrayOfJson } from "~/utilities/filterJson";
import { fetchAsyncData } from "~/composables/useAsyncFetch";
import {
  getApiContentLanguage,
  getEducationRouteQuery,
  getHubLanguage,
  getHubPath,
  resolveRouteLanguage,
  resolveEducationLevelFromRoute,
} from "~/utilities/educationRoute";

// Defin Route
const route = useRoute();
const router = useRouter();
const redirectToAuth = () =>
  router.replace({
    path: "/auth",
    query: { redirect: route.fullPath },
  });
const decodeParam = (value: unknown) => {
  const raw = typeof value === "string" ? value : "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
const subjectId = String(route.params.subjectId ?? "");
const subjectTitle = decodeParam(route.params.subject).replaceAll("-", " ");
const primaryContentLanguage = usePrimaryContentLanguage();

const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
const tabLanguage = computed(() =>
  getHubLanguage(
    educationLevel.value,
    resolveRouteLanguage(route, educationLevel.value, primaryContentLanguage.value),
  ),
);
const educationRouteQuery = computed(() =>
  getEducationRouteQuery(educationLevel.value, {}, tabLanguage.value),
);
const apiLanguage = computed(() =>
  getApiContentLanguage(educationLevel.value, tabLanguage.value),
);

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

const accessToken = useCookie("signInAccessToken");
const userToken = useCookie("signInUserToken");
const isLoggedIn = computed(() => !!(accessToken?.value || userToken?.value));

// general level
const currentLevel = ref<Record<string, string>>({});
const getLevels = (data: any[]) => {
  // extracting levels
  let list = data?.map((t: any) => (t?.level as any).name || t?.level);
  return new Set(list);
};
const levelFilterKey = computed(() => subjectSlug.value || "topics");
const selectedLevel = computed({
  get: () => currentLevel.value[levelFilterKey.value] || "",
  set: (value: string) => {
    currentLevel.value[levelFilterKey.value] = value;
  },
});
const availableLevels = computed(() =>
  Array.from(getLevels(topic.value as any[]))
    .filter((lvl): lvl is string => typeof lvl === "string" && !!lvl.trim())
    .map((lvl) => ({
      id: lvl,
      name: lvl,
    })),
);
const filteredTopics = computed(() => {
  if (!Array.isArray(topic.value)) return [];
  if (!selectedLevel.value) return topic.value;
  return topic.value.filter(
    (item: any) => ((item?.level as any)?.name || item?.level) === selectedLevel.value,
  );
});

// Define Ref State
const status = ref("pending"); // Initial Status State
const topic = ref([]); // Initial Topics State
const slicedData = ref(); // Initial slice data to 9
const activeTab = ref<tabs>("subjects");

// First, fix the sliceData function
const sliceData = (start: number, end: number) => {
  if (!filteredTopics.value.length) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (filteredTopics.value.length <= pageSize.value) {
    slicedData.value = filteredTopics.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value = filteredTopics.value.slice(start, end);
};

// current page data
const currentPage = ref(1);
const pageSize = ref();
const getPageSize = () => {
  if (screenWidth.value >= 1280 || isGreaterToXL.value) return 12;
  if (screenWidth.value >= 1024 || isGreaterToLG.value) return 9;
  if (screenWidth.value >= 768 || isGreaterToMD.value) return 6;
  return 4;
};
const TAB_TO_ROUTE: Record<string, { path: string; query?: Record<string, any> }> = {
  "interactive-contents": { path: "/interactive", query: educationRouteQuery.value },
  "learn-activities": { path: "/experiments", query: educationRouteQuery.value },
  video: { path: "/video", query: { ...educationRouteQuery.value, type: "conc" } },
  "class-videos": { path: "/video", query: { ...educationRouteQuery.value, type: "oth" } },
  audio: { path: "/audio", query: educationRouteQuery.value },
  "smart-class": { path: "/smart-class" },
};

const subjectSlug = computed(() => subjectTitle.toLowerCase().trim().replace(/\s+/g, "-"));

const buildTabTarget = (tab: string) => {
  if (tab === "subjects") {
    return {
      path: getHubPath(educationLevel.value),
    };
  }
  if (tab === "smart-class") return TAB_TO_ROUTE["smart-class"];

  const hasSubjectContext = !!subjectId && !!subjectSlug.value;
  if (!hasSubjectContext) {
    return TAB_TO_ROUTE[tab] ?? { path: getHubPath(educationLevel.value) };
  }

  if (tab === "interactive-contents") {
    return { path: `/interactive/${subjectSlug.value}/${subjectId}`, query: educationRouteQuery.value };
  }
  if (tab === "learn-activities") {
    return { path: `/experiments/${subjectSlug.value}/${subjectId}`, query: educationRouteQuery.value };
  }
  if (tab === "video") {
    return {
      path: `/video/${subjectSlug.value}/${subjectId}`,
      query: { ...educationRouteQuery.value, type: "conc" },
    };
  }
  if (tab === "class-videos") {
    return {
      path: `/video/${subjectSlug.value}/${subjectId}`,
      query: { ...educationRouteQuery.value, type: "oth" },
    };
  }
  if (tab === "audio") {
    return { path: `/audio/${subjectSlug.value}/${subjectId}`, query: educationRouteQuery.value };
  }

  return TAB_TO_ROUTE[tab] ?? { path: getHubPath(educationLevel.value) };
};

const switchTab = async (tab: string) => {
  if (!tab) return;
  activeTab.value = tab as tabs;
  const target = buildTabTarget(tab);
  await router.push(target);
};

// Then, update fetchTopics to call sliceData after data is loaded
const fetchTopics = async (params: any) => {
  

  if (userToken) {
    let userId = (userToken.value as any)?._id;
  params={...params,userId }
  }


  try {
    status.value = "pending";
    currentPage.value = 1;
    const { data: response, status: fetchStatus } = await fetchAsyncData(`interactive-${educationLevel.value}-${tabLanguage.value}-${subjectId}`, () => $fetch(apiDocs.topics.getSubjectId.replace(
      "{subjectId}",
      subjectId
    ), {
      params: {
        educationLevel: educationLevel.value,
        ...(apiLanguage.value ? { language: apiLanguage.value } : {}),
        ...params,
      },
      headers: {
        Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
      },
    }))

    // Call State Define above
    topic.value = removeDataFromArrayOfJson(response.value, "isDeleted", true);
    status.value = fetchStatus.value;

    goToPage(1);
  } catch (error) {
    status.value = "error";
    slicedData.value = [];
    redirectToAuth();
  }
};

// Call Fetch Topics function
fetchTopics({});

//  assigning page size based on screen sizes
pageSize.value = getPageSize();

// total pages data
const totalPages = computed(() => {
  if (filteredTopics.value.length) {
    return Math.ceil(filteredTopics.value.length / pageSize.value);
  }
  return 0; // Default to 0 if no data
});

const goToPage = (page: number) => {
  const nextPageNumber = Math.min(Math.max(page, 1), Math.max(totalPages.value, 1));
  currentPage.value = nextPageNumber;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
};

// Watch screen width and update page size accordingly
watch(
  () => screenWidth.value,
  () => {
    pageSize.value = getPageSize();
    goToPage(currentPage.value);
  }
);

watch(totalPages, (pages) => {
  if (pages === 0) {
    currentPage.value = 1;
    slicedData.value = [];
    return;
  }

  if (currentPage.value > pages) {
    goToPage(pages);
  }
});

// loadoing indicator
const { progress, isLoading } = useLoadingIndicator();

const contentLayoutLanguage = useContentLayoutLanguage();

// Define Filters Reactive State
const filters = reactive({
  level: null,
  subject: null,
});

const level = ref(); // Initial Level State
// watch emits changes
watch(filters, (filters) => {
  fetchTopics({
    level: filters?.level,
    subject: filters?.subject,
  });
});

watch(selectedLevel, () => {
  goToPage(1);
});
</script>

<template>
  <NuxtLayout name="home-layout" :language="contentLayoutLanguage" :education-level>
    <div class="" :class="{ ' animate-pulse': isLoading }">
      <div class="flex flex-col gap-4">
        <!-- Keep hero-style search visible for both logged-in and logged-out -->
        <HomeSearchbar appearance="not-normal" :language="contentLayoutLanguage" />
        <TabBar :is-logged-in="isLoggedIn" :active-tab="activeTab" @emit-active-tab="switchTab($event)"
          :subject-title="subjectTitle" :topic-id="subjectId" :tab-group="educationLevel" :language="tabLanguage" />
      </div>
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
        <ClientOnly v-if="slicedData?.length > 0">
          <div class="flex flex-col w-full">
            <div class="flex items-start gap-4">
              <!-- Topic Cards are in Grid -->
              <div class="flex flex-col w-full">

                <div class="flex items-center justify-end w-full">
                  <div class="w-64">
                    <!-- Custom Drop Down -->
                    <CustomDropDownList v-if="availableLevels.length > 1" class="px-2 cursor-pointer"
                      v-model="selectedLevel" placeholder="select class level" :list="availableLevels" />
                  </div>
                </div>

                <customGridTwo>
                  <template #data>
                    <TopicCard v-for="topic in slicedData" :key="topic._id" :topic-id="topic._id"
                      :topic-image="topic.thumbnail" :topic-title="topic.name" :topic-description="topic.descriptions"
                      :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'"
                      :topic-likes="topic.topic_likes ? topic.topic_likes : 100" :topic-views="topic.viewedBy?.length ? topic.viewedBy?.length
                        : topic.views ? topic.views : 0" :topic-level="level" :topic-standard="topic.level.name"
                      :subject-name="topic.subject.name" :topic-viewed="topic.isViewed"
                      :topic-progress="topic.avgProgress" />
                  </template>
                </customGridTwo>
              </div>
            </div>

            <AppPagination
              :current-page="currentPage"
              :total-pages="totalPages"
              class-name="my-5"
              @change="goToPage"
            />
          </div>
        </ClientOnly>
        <MessageTopicNotFound v-else />
      </div>

      <!-- Even Data was not success should be handle here -->
      <div class="flex flex-col w-full" v-else>
        <div class="">
          Try to refresh the page, Something went Wrong
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
