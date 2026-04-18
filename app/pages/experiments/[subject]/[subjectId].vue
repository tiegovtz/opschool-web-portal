<script setup>

import HeroSection from "@/components/home/HeroSection.vue";
import TabBar from "@/components/home/TabBar.vue";
import { ref, computed, onMounted, watch } from "vue";
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  screenWidth,
} from "@/utilities/controlls";
import ExperimentsCard from "@/components/experiments/experimentsCard.vue";
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
const decodeParam = (value) => {
  const raw = typeof value === "string" ? value : "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
const subjectId = String(route.params.subjectId ?? "");
const subjectTitle = decodeParam(route.params.subject).replaceAll("-", " ");
const activeTab = ref("learn-activities");
const subjectSlug = computed(() => (subjectTitle || "").toLowerCase().trim().replace(/\s+/g, "-"));
const primaryContentLanguage = usePrimaryContentLanguage();
const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
const language = computed(() =>
  getHubLanguage(
    educationLevel.value,
    resolveRouteLanguage(route, educationLevel.value, primaryContentLanguage.value),
  ),
);
const educationRouteQuery = computed(() =>
  getEducationRouteQuery(educationLevel.value, {}, language.value),
);
const apiLanguage = computed(() =>
  getApiContentLanguage(educationLevel.value, language.value),
);

const buildTabTarget = (tab) => {
  if (tab === "subjects") return { path: getHubPath(educationLevel.value) };
  if (tab === "smart-class") return { path: "/smart-class" };

  const hasSubjectContext = !!subjectId && !!subjectSlug.value;
  if (!hasSubjectContext) {
    if (tab === "interactive-contents") return { path: "/interactive", query: educationRouteQuery.value };
    if (tab === "learn-activities") return { path: "/experiments", query: educationRouteQuery.value };
    if (tab === "video") return { path: "/video", query: { ...educationRouteQuery.value, type: "conc" } };
    if (tab === "class-videos") return { path: "/video", query: { ...educationRouteQuery.value, type: "oth" } };
    if (tab === "audio") return { path: "/audio", query: educationRouteQuery.value };
    return { path: getHubPath(educationLevel.value) };
  }

  if (tab === "interactive-contents") return { path: `/interactive/${subjectSlug.value}/${subjectId}`, query: educationRouteQuery.value };
  if (tab === "learn-activities") return { path: `/experiments/${subjectSlug.value}/${subjectId}`, query: educationRouteQuery.value };
  if (tab === "video") return { path: `/video/${subjectSlug.value}/${subjectId}`, query: { ...educationRouteQuery.value, type: "conc" } };
  if (tab === "class-videos") return { path: `/video/${subjectSlug.value}/${subjectId}`, query: { ...educationRouteQuery.value, type: "oth" } };
  if (tab === "audio") return { path: `/audio/${subjectSlug.value}/${subjectId}`, query: educationRouteQuery.value };

  return { path: getHubPath(educationLevel.value) };
};

const switchTab = async (tab) => {
  if (!tab) return;
  activeTab.value = tab;
  await router.push(buildTabTarget(tab));
};

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

const userToken = useCookie("signInUserToken");

// Define Ref State
const status = ref("pending"); // Initial Status State
const topic = ref([]); // Initial Topics State
const slicedData = ref(); // Initial slice data to 9

// First, fix the sliceData function
const sliceData = (start, end) => {
  if (!topic.value || !Array.isArray(topic.value) || topic.value.length === 0) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (topic.value.length <= pageSize.value) {
    slicedData.value = topic.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value = topic.value.slice(start, end);
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

// Then, update fetchTopics to call sliceData after data is loaded
const fetchTopics = async (params) => {
  try {
    status.value = "pending";
    currentPage.value = 1;
    const {data:response,status:fetchStatus} = await fetchAsyncData(`experiments-${language.value}-${subjectId}`, () => $fetch(apiDocs.experiments.getPublicExperimentsBySubjectId.replace(
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
    }));

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
  if (topic.value && Array.isArray(topic.value)) {
    return Math.ceil(topic.value.length / pageSize.value);
  }
  return 0; // Default to 0 if no data
});

const goToPage = (page) => {
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

</script>

<template>
  <NuxtLayout name="home-layout" :language="contentLayoutLanguage">
    <main class="" :class="{ ' animate-pulse': isLoading }"  aria-busy="isLoading ? 'true' : 'false'">
      <HomeSearchbar v-if="userToken" appearance="rounded" :language :education-level="educationLevel" />
      <HeroSection v-else :language :education-level="educationLevel" />
      <!-- Tabs -->
      <nav aria-label="Subject tabs">
      <TabBar :is-logged-in="!!userToken" :active-tab="activeTab" @emit-active-tab="switchTab($event)" :subject-title="subjectTitle" :topic-id="subjectId" :language :education-level="educationLevel" :tab-group="educationLevel" />
      </nav>
      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex flex-col items-center justify-center" role="status"
        aria-live="polite">
        <LoadingIndicator :is-loading="true" />
      </div>
      <!-- Status Error -->
      <div v-else-if="status === 'error'" class="md:min-h-[342px] flex flex-col justify-center items-center" 
      role="alert"
        aria-live="assertive">
        <Icon name="codicon:errorr" class="mb-4 text-red-500" size="20" aria-hidden="true"/>
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
            <div class="flex items-center gap-4">
              <!-- Topic Cards are in Grid -->
              <div class="flex flex-col items-start ">
                <customGridTwo>
                  <template #data>
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
                      :alt="experiment.title"
                    />
                  </template>
                </customGridTwo>
              </div>
            </div>

            <AppPagination
              :current-page="currentPage"
              :total-pages="totalPages"
               :first-label="useContentLayoutLanguage().value=='kiswahili' ? 'Mwanzo' :'First'"
                :last-label="useContentLayoutLanguage().value=='kiswahili' ? 'Mwisho' :'Last'"
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
    </main>
  </NuxtLayout>
</template>
