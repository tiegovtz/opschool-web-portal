<template>
  <NuxtLayout
    :name="$router.currentRoute.value.fullPath.includes('header-less') ? ('normal' as any) : ('home-layout' as any)"
  >
    <main
      ref="pageRoot"
      id="main-container"
      tabindex="-1"
      class="min-h-screen bg-white font-sans text-gray-900"
    >
      <div class="container mx-auto max-w-7xl px-4 py-10">

        <!-- Back -->
        <NuxtLink
          v-if="canGoBack"
          to="/"
          class="mb-6 text-primary inline-flex items-center gap-2 rounded-full border border-primary bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Icon name="mdi:arrow-left" size="18" />
          Back
        </NuxtLink>

        <!-- Header -->
        <header class="mb-8">
          <p class="text-xs uppercase tracking-widest text-gray-400">
            Smart Class Hub
          </p>

          <h1 class="mt-2 text-3xl font-bold text-primary">
            Learn Live, Rewatch, or Tune In
          </h1>

          <p class="mt-3 max-w-2xl text-gray-600">
            Join live classes, watch SomaKwanza TV, or access your recorded sessions.
          </p>
        </header>

        <!-- Main Card -->
        <section
          class="rounded-3xl border border-gray-200 bg-white shadow-sm"
        >

          <!-- Tabs -->
          <div
            class="flex flex-wrap items-center gap-2 border-b border-gray-200 p-4"
            role="tablist"
          >
            <button
              v-for="item in items"
              :key="item.value"
              role="tab"
              type="button"
              :aria-selected="activeTab === item.value"
              :class="[
                activeTab === item.value
                  ? 'bg-primary text-white'
                  : 'text-primary hover:bg-gray-100',
                'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition'
              ]"
              @click="activeTab = item.value"
            >
              <Icon :name="item.icon" size="18" />
              {{ item.title }}
            </button>

            <span class="ml-auto hidden text-sm text-gray-500 md:block">
              {{ activeItem.availability }}
            </span>
          </div>

          <!-- Summary -->
          <div class="border-b border-gray-200 p-6">

            <div class="flex flex-wrap items-start justify-between gap-4">

              <div>
                <p class="text-xs uppercase tracking-widest text-gray-400">
                  {{ activeTabPanel.heading }}
                </p>

                <p class="mt-2 text-lg font-semibold">
                  {{ activeTabPanel.summary }}
                </p>

                <p v-if="activeItem.note" class="mt-2 text-sm text-gray-600">
                  <!-- Login required to view this content -->
                   <div v-if="!activeItem.note" class="flex gap-1 items-center justify-center mx-auto">
                    <p class="text-sm text-gray-600">
                      You must be logged in to view this content. Click
                    </p>

                    <NuxtLink
                      to="/auth"
                      class="text-primary font-medium hover:underline"
                    >
                      here to sign in.
                    </NuxtLink>
                   </div>
                </p>
              </div>

              <button
                v-if="activeTab !== 'live-tv'"
                type="button"
                class="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                @click="openViewAll(activeTab)"
              >
                View all
              </button>

            </div>
          </div>

          <!-- Content -->
          <div class="p-6">

            <!-- SOMAKWANZA TV -->
            <div
              v-if="activeTab === 'live-tv'"
              class="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]"
            >

              <!-- Screen -->
              <div
                class="overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-md"
              >
                <div
                  class="flex items-center justify-between bg-gray-100 px-4 py-2"
                >
                  <span class="text-sm font-semibold">
                    SomaKwanza TV
                  </span>

                  <span class="text-xs text-primary font-medium">
                    LIVE
                  </span>
                </div>

                <video
                  v-if="activeTabPanel.streamUrl"
                  :src="activeTabPanel.streamUrl"
                  class="h-[420px] w-full"
                  autoplay="true"
                  loading="lazy"
                />

                <div
                  v-else
                  class="grid h-[420px] place-items-center text-gray-400"
                >
                  Stream unavailable
                </div>
              </div>

              <!-- Info -->
              <div class="space-y-4">

                <div
                  class="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >
                  <p class="text-xs uppercase tracking-widest text-gray-400">
                    Now Playing from
                  </p>

                  <p class="mt-2 text-lg font-semibold text-primary">
                    {{ activeTabPanel.nowPlaying }}
                  </p>
                </div>
              </div>
            </div>

            <!-- CARDS -->
            <div
              v-else
              class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >

              <article
                v-for="card in activeCards"
                :key="card.id ?? card.title"
                class="group rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <!-- Image -->
                <div class="relative h-44 overflow-hidden rounded-t-2xl bg-gray-100">

                  <img
                    v-if="card.thumbnail"
                    :src="card.thumbnail"
                    class="h-full w-full object-cover"
                  />

                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center subject-gradient"
                    :style="{ backgroundImage: card.subjectGradient }"
                  >
                    <span class="subject-gradient__initials">
                      {{ card.subjectInitials }}
                    </span>
                  </div>

                  <div
                    class="subject-gradient-overlay"
                    :style="{ backgroundImage: card.subjectGradient }"
                  ></div>
                </div>

                <!-- Body -->
                <div class="p-4">

                  <h3 class="font-semibold">
                    {{ card.title || 'Upcoming session' }}
                  </h3>

                  <p class="mt-1 text-sm text-gray-600">
                    {{ card.instructor || 'SomaKwanza Teacher' }}
                  </p>

                  <div
                    class="mt-3 flex items-center justify-between text-xs text-gray-500"
                  >
                    <span>
                      {{ card.subject ?? card.category }}
                    </span>

                    <span>
                      {{ card.time }}
                    </span>
                  </div>

                  <p
                    class="mt-3 text-sm text-gray-600"
                  >
                    {{ card.description || 'No description available.' }}
                  </p>

                  <p
                    v-if="card.viewers"
                    class="mt-2 text-xs text-gray-400"
                  >
                    {{ card.viewers }}
                  </p>

                </div>
              </article>

            </div>

          </div>

        </section>

        <div
          v-if="viewAllDialog"
          class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-10"
          role="dialog"
          aria-modal="true"
          :aria-label="`View all ${viewAllSection === 'live-classes' ? 'live classes' : 'recorded sessions'}`"
        >
          <div class="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <h2 class="text-lg font-semibold text-primary">
                {{ viewAllSection === 'live-classes' ? 'All Live Classes' : 'All Recorded Sessions' }}
              </h2>
              <button
                type="button"
                class="text-sm font-semibold text-primary hover:text-primary/60 border border-primary rounded-lg px-2 py-1"
                @click="closeViewAll"
              >
                Close
              </button>
            </header>
            <div class="p-6">
              <div class="grid gap-4 md:grid-cols-2">
                <article
                  v-for="card in viewAllCards"
                  :key="card.id ?? card.title"
                  class="group flex gap-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
                >
                  <div class="h-32 w-32 flex-shrink-0 overflow-hidden rounded-l-lg bg-slate-200">
                    <div
                      v-if="card.thumbnail"
                      class="h-full w-full bg-cover bg-center"
                      :style="{ backgroundImage: `url(${card.thumbnail})` }"
                    ></div>
                    <div
                      v-else
                      class="h-full w-full bg-cover bg-center p-4"
                      :style="{
                        backgroundImage: `${card.iconPattern}, ${card.gradient}`,
                        backgroundSize: '60px 60px, cover',
                      }"
                    >
                      <span class="pattern-icon">{{ card.iconSymbol }}</span>
                    </div>
                  </div>
                  <div class="p-3">
                    <h3 class="text-md font-semibold text-slate-900">{{ card.title }}</h3>
                    <p class="text-sm text-slate-500">{{ card.instructor }}</p>
                    <p class="mt-2 text-sm text-slate-600 max-w-full truncate">{{ card.description || card.details }}</p>
                    <div class="mt-3 text-xs text-slate-500">
                      <span class="font-semibold">Subject:</span> {{ card.subject || card.category }}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNavigationStore } from "~/stores/navigationStore";
import apiDocs from "~/utilities/apiDocs";

const canGoBack = ref(false);
const route = useRoute();
const navigationStore = useNavigationStore();
const router = useRouter();

const accessToken = useCookie("signInAccessToken").value;
const liveCards = ref([]);
const recordedCards = ref([]);
const isLoadingCards = ref(false);

const streamHeaders = {
  accept: "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
};
const somakwanzaStream = ref("https://tv.somakwanza.tz");

const defaultThumbnail = "https://media.istockphoto.com/id/1425207399/photo/book-sign-3d-render-concept-for-study-earn-knowledge-reading-and.webp?a=1&b=1&s=612x612&w=0&k=20&c=c94CC40l2cSPQARpJLbGK8J8u9EfEYUQzVe41xr0G6A=";
const defaultRecordingThumbnail = "https://plus.unsplash.com/premium_photo-1677589330395-4a9e1ae99b10?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNvb2wlMjBmYWxsYmFjayUyMHJlY29yZGluZyUyMGljb24lMjBpbWFnZXxlbnwwfHwwfHx8MA%3D%3D";

const accessTokenCookie = useCookie("signInAccessToken");
const userTokenCookie = useCookie("signInUserToken");

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    accept: "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

const formatSessionTime = (value?: string | number) => {
  if (!value) return "TBD";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "TBD";

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const deriveDuration = (start?: string, end?: string) => {
  if (!start || !end) return "45m";

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "45m";

  let diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) diff = Math.abs(diff);
  const minutes = Math.round(diff / 60000);

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m`;
};

const subjectPalettes: Record<string, [string, string]> = {
  chemistry: ["#3B82F6", "#9333EA"],
  mathematics: ["#F97316", "#FDE68A"],
  biology: ["#10B981", "#059669"],
  physics: ["#6366F1", "#1D4ED8"],
  history: ["#D97706", "#FBBF24"],
  english: ["#EC4899", "#F472B6"],
  default: ["#38BDF8", "#6366F1"],
};

const normalizeList = (payload: any) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const hostUrl = apiDocs.baseURL.replace(/\/v1\/?$/, "");
const buildAssetUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${hostUrl}/${path.replace(/^\//, "")}`;
};

const buildGradient = (subject?: string | null) => {
  const key = (subject ?? "default").toString().toLowerCase().replace(/\s+/g, "-");
  const palette = subjectPalettes[key] || subjectPalettes.default;
  return `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
};

const getSubjectInitials = (label?: string | null) => {
  if (!label) return "SC";
  const words = label.trim().split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const mapLiveSessionToCard = (session: any) => {
  const instructor = session?.teacherId?.name || session?.teacherName || session?.teacher?.name || "Teacher";
  const start = session?.start_time;
  const end = session?.end_time;
  const subjectLabel = typeof session?.subject === "object" ? session.subject?.name : session?.subject;
  const schoolLabel = session?.school_class?.name || session?.school_class || session?.schoolClass || session?.school;
  const badge = session?.session_start ? "Live" : session?.session_end ? "Ended" : "Upcoming";

  return {
    id: session?._id,
    title: session?.topic || session?.title || "Live Session",
    instructor,
    thumbnail: session?.thumbnail || defaultThumbnail,
    category: schoolLabel || "General",
    subject: subjectLabel || "General",
    duration: deriveDuration(start, end),
    description: session?.details || session?.description || "Interactive live lesson",
    time: formatSessionTime(start),
    badge,
    subjectGradient: buildGradient(subjectLabel ?? schoolLabel),
    subjectInitials: getSubjectInitials(subjectLabel ?? schoolLabel),
  };
};

const mapRecordedSessionToCard = (session: any) => {
  const video = session?.video || {};
  const classLabel = session?.schoolClass?.name || session?.school_class?.name || session?.schoolClass || session?.school_class || "Recorded";
  let subjectLabel = typeof session?.subject === "object" ? session.subject?.name : session?.subject || classLabel;
  const timestamp = session?.createdAt || session?.updatedAt || video?.createdAt || video?.updatedAt;

  return {
    id: session?._id ?? session?.videoId ?? session?.id,
    title: session?.title || video?.name || "Recorded Session",
    instructor: session?.teacher?.name || session?.teacherName || session?.teacher_name || "SomaKwanza",
    // thumbnail: buildAssetUrl(video?.thumbnail) || defaultThumbnail,
    thumbnail: defaultRecordingThumbnail,
    category: classLabel,
    subject: subjectLabel,
    duration: session?.duration || video?.duration || "Recorded",
    description: session?.description || session?.details || video?.description || "Replay available",
    time: formatSessionTime(timestamp),
    badge: "Recorded",
    subjectGradient: buildGradient(subjectLabel ?? classLabel),
    subjectInitials: getSubjectInitials(subjectLabel ?? classLabel),
    recordingUrl: buildAssetUrl(video?.videoFileUrl) || "",
  };
};

const fetchLiveCards = async () => {
  try {
    const headers = getHeaders();
    const response = await $fetch(`${apiDocs.liveClassrooms.sessions}`, {
      headers,
      query: {
        limit: 6,
      },
    });

    const items = normalizeList(response);
    liveCards.value = items.slice(0, 6).map(mapLiveSessionToCard);
  } catch (err) {
    console.error('Failed to load live cards:', err);
    handleUnauthorized(err);
  }
};

const fetchRecordedCards = async () => {
  try {
    const headers = getHeaders();
    const response = await $fetch(`${apiDocs.liveClassrooms.recordedSessions}`, {
      headers,
      query: {
        isRecorded: true,
        limit: 6,
      },
    });

    const items = normalizeList(response);
    recordedCards.value = items.slice(0, 6).map(mapRecordedSessionToCard);
  } catch (err) {
    console.error('Failed to load recorded cards:', err);
    handleUnauthorized(err);
  }
};

const loadTabCards = async () => {
  isLoadingCards.value = true;
  try {
    await Promise.allSettled([fetchLiveCards(), fetchRecordedCards()]);
  } finally {
    isLoadingCards.value = false;
  }
};

const loadSomaStream = async () => {
  try {
    const response = await $fetch(`${apiDocs.liveClassrooms.streamingLinks}`, {
      headers: streamHeaders,
    });
    const items = Array.isArray(response) ? response : response?.items ?? response?.data ?? [];
    const activeLink = (Array.isArray(items) ? items : []).find((link) => link?.is_active || link?.isActive);
    if (activeLink) {
      somakwanzaStream.value = activeLink.url || activeLink.streamUrl || activeLink.link || activeLink.streamingUrl || somakwanzaStream.value;
      somakwanzaStream.title = activeLink.title || "Educational Programs";
      somakwanzaStream.description = activeLink.description || "Educational live broadcast.";
    }
  } catch (err) {
    console.error("Failed to load SomaKwanza stream:", err);
  }
};

const handleUnauthorized = (error) => {
  const status = error?.status || error?.response?.status || error?.statusCode;
  if (status === 401) {
    accessTokenCookie.value = null;
    userTokenCookie.value = null;
    router.push('/auth');
  }
};

onMounted(() => {
  canGoBack.value = window.history.length > 1;
  loadTabCards();
  loadSomaStream();
});

const viewAllDialog = ref(false);
const viewAllSection = ref('live-classes');
const viewAllCards = computed(() =>
  viewAllSection.value === "live-classes" ? liveCards.value : recordedCards.value
);

const openViewAll = (section: string) => {
  viewAllSection.value = section;
  viewAllDialog.value = true;
};

const closeViewAll = () => {
  viewAllDialog.value = false;
};

/* Tabs */

const items = [
  {
    title: "Live Classes",
    value: "live-classes",
    icon: "mdi:video",
    notifications: 3,
    availability: "",
    note: "New sessions start soon"
  },
  {
    title: "SomaKwanza TV",
    value: "live-tv",
    icon: "mdi:television",
    notifications: 1,
    availability: "",
    note: "Live educational broadcasts"
  },
  {
    title: "Recorded Sessions",
    value: "recorded-sessions",
    icon: "mdi:video-vintage",
    notifications: 0,
    availability: "",
    note: "Learn at your own pace"
  }
];

const activeTab = ref(items[0].value);

const activeItem = computed(() =>
  items.find((i) => i.value === activeTab.value)!
);

/* Panels */
const tabPanels = computed(() => ({
  "live-classes": {
    heading: "Live classrooms",
    summary: "Join interactive lessons in real time.",
    cards: liveCards
  },

  "live-tv": {
    heading: "SomaKwanza TV",
    summary: "Educational live broadcast.",
    streamUrl: somakwanzaStream.value,
    nowPlaying: somakwanzaStream?.title || "Educational Programs",
    schedule: somakwanzaStream?.description || "",
  },

  "recorded-sessions": {
    heading: "Recorded library",
    summary: "Revisit past lessons.",
    cards: recordedCards
  }
}));

const activeTabPanel = computed(
  () => tabPanels.value[activeTab.value]
);

const activeCards = computed(() => {
  if (activeTab.value === "live-classes") return liveCards.value;
  if (activeTab.value === "recorded-sessions") return recordedCards.value;
  return [];
});

const getItemPath = (value: string) =>
  `/smart-class/screen/${value}`;

const prepareNavigation = () => {
  navigationStore.setGoBack(route.fullPath);
};
</script>

<style scoped>
.subject-gradient {
  background-size: 160%;
  background-position: center;
}

.subject-gradient__initials {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 10px 20px rgba(15, 23, 42, 0.4);
}

.subject-gradient-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  mix-blend-mode: screen;
  pointer-events: none;
}
</style>
