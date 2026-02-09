<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNavigationStore } from "~/stores/navigationStore";
import apiDocs from "~/utilities/apiDocs";
import EmptyState from "~/components/common/EmptyState.vue";

const canGoBack = ref(false);
const route = useRoute();
const navigationStore = useNavigationStore();
const router = useRouter();

type TabKey = "live-classes" | "live-tv" | "recorded-sessions";

type TabItem = {
  title: string;
  value: TabKey;
  icon: string;
  notifications: number;
  availability: string;
  note: string;
};

type SessionCard = {
  id?: string;
  title?: string;
  instructor?: string;
  description?: string;
  details?: string;
  subject?: string;
  category?: string;
  duration?: string;
  time?: string;
  viewers?: number;
  thumbnail?: string;
  subjectGradient?: string;
  subjectInitials?: string;
  badge?: string;

  // recorded
  recordingUrl?: string;

  // live (optional)
  streamUrl?: string;
  joinUrl?: string; // mapped from meet_link
};

const accessTokenCookie = useCookie("signInAccessToken");
const userTokenCookie = useCookie("signInUserToken");
const accessToken = accessTokenCookie.value;

const liveCards = ref<SessionCard[]>([]);
const recordedCards = ref<SessionCard[]>([]);
const isLoadingCards = ref(false);

/**
 * Session-expired modal (shows on any 401 from requests on this page)
 */
const sessionExpiredModalOpen = ref(false);
const sessionExpiredMessage = ref("Your session has expired. Please sign in again.");

const openSessionExpiredModal = (message?: string) => {
  // Avoid spamming if multiple requests fail at the same time
  if (sessionExpiredModalOpen.value) return;

  sessionExpiredMessage.value = message || "Your session has expired. Please sign in again.";
  sessionExpiredModalOpen.value = true;

  // Close other modals for clarity (optional)
  sessionModalOpen.value = false;
  viewAllDialog.value = false;
  selectedSession.value = null;

  if (process.client) document.documentElement.style.overflow = "hidden";
};

const clearSessionAndRedirect = async () => {
  // Clear cookies
  accessTokenCookie.value = null;
  userTokenCookie.value = null;

  sessionExpiredModalOpen.value = false;
  if (process.client) document.documentElement.style.overflow = "";

  await router.push("/auth");
};

const streamHeaders = {
  accept: "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
};

const somakwanzaStreamUrl = ref("https://tv.somakwanza.tz");
const somakwanzaStreamMeta = ref({
  title: "SomaKwanza TV",
  description: "Educational live broadcast.",
});

const defaultThumbnail =
  `https://media.istockphoto.com/id/1425207399/photo/book-sign-3d-render-concept-for-study-earn-knowledge-reading-and.webp?a=1&b=1&s=612x612&w=0&k=20&c=c94CC40l2cSPQARpJLbGK8J8u9EfEYUQzVe41xr0G6A=`;

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
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${hostUrl}/${path.replace(/^\//, "")}`;
};

const buildGradient = (subject?: string | null) => {
  const key = (subject ?? "default").toString().toLowerCase().replace(/\s+/g, "-");
  const palette = subjectPalettes[key] ?? subjectPalettes.default;
  const [primaryColor, secondaryColor] = palette ?? subjectPalettes.default;
  return `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
};

const getSubjectInitials = (label?: string | null) => {
  if (!label) return "SC";
  const words = label.trim().split(" ").filter(Boolean);
  if (words.length === 0) return "SC";
  if (words.length === 1) return  words[0].substring(0, 2).toUpperCase();
  const [first, second] = words;
  const firstChar = first?.[0] ?? "";
  const secondChar = second?.[0] ?? "";
  return (firstChar + secondChar).toUpperCase();
};

const mapLiveSessionToCard = (session: any): SessionCard => {
  const instructor =
    session?.teacherId?.name || session?.teacherName || session?.teacher?.name || "Teacher";
  const start = session?.start_time;
  const end = session?.end_time;

  const subjectLabel =
    typeof session?.subject === "object" ? session.subject?.name : session?.subject;

  const schoolLabel =
    session?.school_class?.name || session?.school_class || session?.schoolClass || session?.school;

  const badge = session?.subject ? session.subject?.name : "";

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

    streamUrl: session?.streamUrl || session?.stream_url,
    joinUrl: session?.meet_link ? session?.meet_link : "",
  };
};

const mapRecordedSessionToCard = (session: any): SessionCard => {
  const video = session?.video || {};

  const classLabel =
    session?.schoolClass?.name ||
    session?.school_class?.name ||
    session?.schoolClass ||
    session?.school_class ||
    "Recorded";

  const subjectLabel =
    (typeof session?.subject === "object" ? session.subject?.name : session?.subject) || classLabel;

  const timestamp = session?.createdAt || session?.updatedAt || video?.createdAt || video?.updatedAt;

  return {
    id: session?._id ?? session?.videoId ?? session?.id,
    title: session?.title || video?.name || "Recorded Session",
    instructor: session?.teacher?.name || session?.teacherName || session?.teacher_name || "SomaKwanza",
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

const handleUnauthorized = (error: unknown) => {
  const payload = error as Record<string, any> | undefined;
  const status = payload?.status || payload?.response?.status || payload?.statusCode;

  if (status === 401) {
    openSessionExpiredModal("Your session has expired. Please sign in again.");
  }
};

const fetchLiveCards = async () => {
  try {
    const headers = getHeaders();
    const response: any = await $fetch(`${apiDocs.liveClassrooms.sessions}`, {
      headers,
      query: { limit: 6 },
    });

    const items = normalizeList(response);
    liveCards.value = items.slice(0, 6).map(mapLiveSessionToCard);
  } catch (err) {
    console.error("Failed to load live cards:", err);
    handleUnauthorized(err);
  }
};

const fetchRecordedCards = async () => {
  try {
    const headers = getHeaders();
    const response: any = await $fetch(`${apiDocs.liveClassrooms.recordedSessions}`, {
      headers,
      query: { isRecorded: true, limit: 6 },
    });

    const items = normalizeList(response);
    recordedCards.value = items.slice(0, 6).map(mapRecordedSessionToCard);
  } catch (err) {
    console.error("Failed to load recorded cards:", err);
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
    const response: any = await $fetch(`${apiDocs.liveClassrooms.streamingLinks}`, {
      headers: streamHeaders,
    });

    const streamItems = Array.isArray(response) ? response : response?.items ?? response?.data ?? [];
    const activeLink = (Array.isArray(streamItems) ? streamItems : []).find(
      (link) => link?.is_active || link?.isActive
    );

    if (activeLink) {
      somakwanzaStreamUrl.value =
        activeLink.url ||
        activeLink.streamUrl ||
        activeLink.link ||
        activeLink.streamingUrl ||
        somakwanzaStreamUrl.value;

      somakwanzaStreamMeta.value = {
        title: activeLink.title || somakwanzaStreamMeta.value.title,
        description: activeLink.description || somakwanzaStreamMeta.value.description,
      };
    }
  } catch (err) {
    console.error("Failed to load SomaKwanza stream:", err);
    handleUnauthorized(err);
  }
};

/* Tabs */
const tabItems: TabItem[] = [
  {
    title: "Live Classes",
    value: "live-classes",
    icon: "mdi:video",
    notifications: 3,
    availability: "",
    note: "New sessions start soon",
  },
  {
    title: "SomaKwanza TV",
    value: "live-tv",
    icon: "mdi:television",
    notifications: 1,
    availability: "",
    note: "Live educational broadcasts",
  },
  {
    title: "Recorded Sessions",
    value: "recorded-sessions",
    icon: "mdi:video-vintage",
    notifications: 0,
    availability: "",
    note: "Learn at your own pace",
  },
];

const activeTab = ref<TabKey>(tabItems[0].value);
const activeItem = computed(() => tabItems.find((i) => i.value === activeTab.value) ?? tabItems[0]);

/* Panels */
type PanelConfig = {
  heading: string;
  summary: string;
  streamUrl?: string;
  nowPlaying?: string;
  schedule?: string[];
};

const tabPanels = computed<Record<TabKey, PanelConfig>>(() => ({
  "live-classes": {
    heading: "Live classrooms",
    summary: "Join interactive lessons in real time.",
  },
  "live-tv": {
    heading: "SomaKwanza TV",
    summary: "Educational live broadcast.",
    streamUrl: somakwanzaStreamUrl.value,
    nowPlaying: somakwanzaStreamMeta.value.title,
    schedule: somakwanzaStreamMeta.value.description
      ? [somakwanzaStreamMeta.value.description]
      : [],
  },
  "recorded-sessions": {
    heading: "Recorded library",
    summary: "Revisit past lessons.",
  },
}));

const activeTabPanel = computed<PanelConfig>(
  () => tabPanels.value[activeTab.value] ?? tabPanels.value["live-classes"]
);

const activeCards = computed(() => {
  if (activeTab.value === "live-classes") return liveCards.value;
  if (activeTab.value === "recorded-sessions") return recordedCards.value;
  return [];
});

const emptyStateMessages: Record<TabKey, { title: string; description: string }> = {
  "live-classes": {
    title: "No live classes yet",
    description: "New live lessons will appear here when scheduled.",
  },
  "recorded-sessions": {
    title: "No recorded sessions",
    description: "Once lessons are recorded they will appear in this library.",
  },
  "live-tv": {
    title: "TV stream unavailable",
    description: "SomaKwanza TV is not broadcasting at the moment.",
  },
};

const currentEmptyStateMessage = computed(() => emptyStateMessages[activeTab.value]);
const shouldShowEmptyState = computed(
  () => !isLoadingCards.value && activeTab.value !== "live-tv" && activeCards.value.length === 0
);
const viewAllEmptyStateMessage = computed(
  () => emptyStateMessages[viewAllSection.value] ?? emptyStateMessages["live-classes"]
);
const showViewAllEmptyState = computed(
  () => !isLoadingCards.value && viewAllCards.value.length === 0
);

/* View All Dialog */
const viewAllDialog = ref(false);
const viewAllSection = ref<TabKey>("live-classes");

const viewAllCards = computed(() =>
  viewAllSection.value === "live-classes" ? liveCards.value : recordedCards.value
);

const openViewAll = (section: TabKey) => {
  viewAllSection.value = section;
  viewAllDialog.value = true;
  if (process.client) document.documentElement.style.overflow = "hidden";
};

const closeViewAll = () => {
  viewAllDialog.value = false;
  if (!sessionModalOpen.value && !sessionExpiredModalOpen.value && process.client) {
    document.documentElement.style.overflow = "";
  }
};

/* Session Player Modal */
const sessionModalOpen = ref(false);
const selectedSession = ref<SessionCard | null>(null);

const openSessionModal = (card: SessionCard) => {
  selectedSession.value = card;
  sessionModalOpen.value = true;
  if (process.client) document.documentElement.style.overflow = "hidden";
};

const closeSessionModal = () => {
  sessionModalOpen.value = false;
  selectedSession.value = null;
  if (!viewAllDialog.value && !sessionExpiredModalOpen.value && process.client) {
    document.documentElement.style.overflow = "";
  }
};

const playableUrl = computed(() => {
  if (!selectedSession.value) return "";
  if (selectedSession.value.recordingUrl) return selectedSession.value.recordingUrl;
  if (selectedSession.value.streamUrl) return selectedSession.value.streamUrl;
  return "";
});

/**
 * Meeting embed
 * NOTE: some providers block embedding (Google Meet/Zoom/Teams).
 */
const isLiveMeeting = computed(() => {
  return !!selectedSession.value?.joinUrl && selectedSession.value?.badge !== "Recorded";
});

const allowedEmbedHosts = new Set([
  "meet.jit.si",
  "meet.somakwanza.com",
  // "www.youtube.com",
  "8x8.vc",
]);

const meetingEmbedUrl = computed(() => {
  const raw = selectedSession.value?.joinUrl?.trim();
  if (!raw) return "";

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "";
  }

  if (url.protocol !== "https:") return "";

  const host = url.hostname.toLowerCase();
  if (!allowedEmbedHosts.has(host)) return "";

  url.searchParams.set("config.prejoinPageEnabled", "false");
  return url.toString();
});

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    if (sessionExpiredModalOpen.value) {
      sessionExpiredModalOpen.value = false;
      if (!viewAllDialog.value && !sessionModalOpen.value && process.client) {
        document.documentElement.style.overflow = "";
      }
      return;
    }
    if (sessionModalOpen.value) closeSessionModal();
    if (viewAllDialog.value) closeViewAll();
  }
};

onMounted(() => {
  canGoBack.value = window.history.length > 1;
  loadTabCards();
  loadSomaStream();
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});

const getItemPath = (value: TabKey) => `/smart-class/screen/${value}`;

const prepareNavigation = () => {
  navigationStore.setGoBack(route.fullPath);
};
</script>

<template>
  <NuxtLayout :name="$router.currentRoute.value.fullPath.includes('header-less') ? ('normal' as any) : ('home-layout' as any)">
    <main ref="pageRoot" id="main-container" tabindex="-1" class="min-h-screen bg-white font-sans text-gray-900">
      <div class="container mx-auto max-w-7xl px-4 py-10">
        <!-- Back -->
        <NuxtLink
          v-if="canGoBack"
          to="/"
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-gray-50"
        >
          <Icon name="mdi:arrow-left" size="18" />
          Back
        </NuxtLink>

        <!-- Header -->
        <header class="mb-8">
          <p class="text-xs uppercase tracking-widest text-gray-400">Smart Class Hub</p>

          <h1 class="mt-2 text-3xl font-bold text-primary">Learn Live, Rewatch, or Tune In</h1>

          <p class="mt-3 max-w-2xl text-gray-600">
            Join live classes, watch SomaKwanza TV, or access your recorded sessions.
          </p>
        </header>

        <!-- Main Card -->
        <section class="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <!-- Tabs -->
          <div class="flex flex-wrap items-center gap-2 border-b border-gray-200 p-4" role="tablist">
            <button
              v-for="tab in tabItems"
              :key="tab.value"
              role="tab"
              type="button"
              :aria-selected="activeTab === tab.value"
              :class="[
                activeTab === tab.value ? 'bg-primary text-white' : 'text-primary hover:bg-gray-100',
                'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition',
              ]"
              @click="activeTab = tab.value"
            >
              <Icon :name="tab.icon" size="18" />
              {{ tab.title }}
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
                  {{ activeItem.note }}
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
            <!-- Loading -->
            <div v-if="isLoadingCards && activeTab !== 'live-tv'" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="n in 6" :key="n" class="animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div class="h-44 w-full rounded-t-2xl bg-gray-100" />
                <div class="p-4 space-y-3">
                  <div class="h-4 w-3/4 rounded bg-gray-100" />
                  <div class="h-3 w-1/2 rounded bg-gray-100" />
                  <div class="h-3 w-full rounded bg-gray-100" />
                  <div class="h-3 w-5/6 rounded bg-gray-100" />
                </div>
              </div>
            </div>

            <!-- SOMAKWANZA TV -->
            <div v-else-if="activeTab === 'live-tv'" class="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
              <!-- Screen -->
              <div class="overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-md">
                <div class="flex items-center justify-between bg-gray-100 px-4 py-2">
                  <span class="text-sm font-semibold">SomaKwanza TV</span>
                  <span class="text-xs font-medium text-primary">LIVE</span>
                </div>

                <iframe
                  v-if="activeTabPanel.streamUrl"
                  :src="activeTabPanel.streamUrl"
                  class="h-[420px] w-full"
                  autoplay="true"
                  loading="lazy"
                />

                <div v-else class="grid h-[420px] place-items-center text-gray-400">
                  Stream unavailable
                </div>
              </div>

              <!-- Info -->
              <div class="space-y-4">
                <div class="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p class="text-xs uppercase tracking-widest text-gray-400">Now Playing from</p>

                  <p class="mt-2 text-lg font-semibold text-primary">
                    {{ activeTabPanel.nowPlaying }}
                  </p>

                  <p v-if="activeTabPanel.schedule?.length" class="mt-2 text-sm text-gray-600">
                    {{ activeTabPanel.schedule[0] }}
                  </p>
                </div>
              </div>
            </div>

            <!-- CARDS -->
            <div v-else>
              <div v-if="shouldShowEmptyState">
                <EmptyState
                  :title="currentEmptyStateMessage?.title"
                  :description="currentEmptyStateMessage?.description"
                />
              </div>

              <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <article
                  v-for="card in activeCards"
                  :key="card.id ?? card.title"
                  class="group rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <!-- Image -->
                  <div class="relative h-44 overflow-hidden rounded-t-2xl bg-gray-100">
                    <img v-if="card.thumbnail" :src="card.thumbnail" class="h-full w-full object-cover" />

                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center subject-gradient"
                      :style="{ backgroundImage: card.subjectGradient }"
                    >
                      <span class="subject-gradient__initials">
                        {{ card.subjectInitials }}
                      </span>
                    </div>

                    <div class="subject-gradient-overlay" :style="{ backgroundImage: card.subjectGradient }"></div>

                    <!-- Play overlay -->
                    <button
                      type="button"
                      class="absolute inset-0 z-10 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
                      aria-label="Play session"
                      @click.stop="openSessionModal(card)"
                    >
                      <span class="grid place-items-center rounded-full bg-white/90 p-3 shadow-lg transition group-hover:scale-110">
                        <Icon name="mdi:play-circle" size="44" class="text-primary" />
                      </span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="p-4">
                    <h3 class="font-semibold">
                      {{ card.title || "Upcoming session" }}
                    </h3>

                    <p class="mt-1 text-sm text-gray-600">
                      {{ card.instructor || "SomaKwanza Teacher" }}
                    </p>

                    <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{{ card.subject ?? card.category }}</span>
                      <span>{{ card.time }}</span>
                    </div>

                    <p class="mt-3 text-sm text-gray-600">
                      {{ card.description || "No description available." }}
                    </p>

                    <p v-if="card.viewers" class="mt-2 text-xs text-gray-400">
                      {{ card.viewers }}
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <!-- View All Modal -->
        <div
          v-if="viewAllDialog"
          class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-10"
          role="dialog"
          aria-modal="true"
          :aria-label="`View all ${viewAllSection === 'live-classes' ? 'live classes' : 'recorded sessions'}`"
          @click.self="closeViewAll"
        >
          <div class="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <h2 class="text-lg font-semibold text-primary">
                {{ viewAllSection === "live-classes" ? "All Live Classes" : "All Recorded Sessions" }}
              </h2>

              <button
                type="button"
                class="rounded-lg border border-primary px-2 py-1 text-sm font-semibold text-primary hover:text-primary/60"
                @click="closeViewAll"
              >
                Close
              </button>
            </header>

            <div class="p-6">
              <div v-if="showViewAllEmptyState" class="space-y-3">
                <EmptyState
                  :title="viewAllEmptyStateMessage?.title"
                  :description="viewAllEmptyStateMessage?.description"
                />
              </div>

              <div v-else class="grid gap-4 md:grid-cols-2">
                <article
                  v-for="card in viewAllCards"
                  :key="card.id ?? card.title"
                  class="group flex gap-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden"
                >
                  <div class="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-l-lg bg-slate-200">
                    <div
                      v-if="card.thumbnail"
                      class="h-full w-full bg-cover bg-center"
                      :style="{ backgroundImage: `url(${card.thumbnail})` }"
                    ></div>

                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center"
                      :style="{ backgroundImage: card.subjectGradient }"
                    >
                      <span class="pattern-icon">{{ card.subjectInitials }}</span>
                    </div>

                    <!-- Play overlay (View all) -->
                    <button
                      type="button"
                      class="absolute inset-0 z-10 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
                      aria-label="Play session"
                      @click.stop="openSessionModal(card)"
                    >
                      <span class="grid place-items-center rounded-full bg-white/90 p-2 shadow-lg transition group-hover:scale-110">
                        <Icon name="mdi:play-circle" size="34" class="text-primary" />
                      </span>
                    </button>
                  </div>

                  <div class="p-3 min-w-0">
                    <h3 class="text-md font-semibold text-slate-900 truncate">{{ card.title }}</h3>
                    <p class="text-sm text-slate-500 truncate">{{ card.instructor }}</p>
                    <p class="mt-2 text-sm text-slate-600 max-w-full truncate">
                      {{ card.description || card.details }}
                    </p>

                    <div class="mt-3 text-xs text-slate-500">
                      <span class="font-semibold">Subject:</span> {{ card.subject || card.category }}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>

        <!-- Session Player Modal -->
        <div
          v-if="sessionModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Session player"
          @click.self="closeSessionModal"
        >
          <div class="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold text-primary">
                  {{ selectedSession?.title || "Session" }}
                </h2>

                <p class="mt-1 text-sm text-gray-600">
                  {{ selectedSession?.instructor || "Instructor" }} • {{ selectedSession?.time || "TBD" }}
                </p>
              </div>

              <button
                type="button"
                class="rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:text-primary/60"
                @click="closeSessionModal"
              >
                Close
              </button>
            </header>

            <div class="p-6">
              <div v-if="playableUrl" class="overflow-hidden rounded-xl bg-black">
                <iframe :src="playableUrl" class="h-[420px] w-full" controls autoplay playsinline />
              </div>

              <div v-else-if="meetingEmbedUrl" class="overflow-hidden rounded-xl bg-black">
                <iframe
                  :src="meetingEmbedUrl"
                  class="h-[420px] w-full"
                  allow="microphone; camera; autoplay; encrypted-media; picture-in-picture"
                  allowfullscreen
                  loading="lazy"
                />
              </div>

              <div v-else class="rounded-xl border-dashed border-primary bg-gray-50 p-6">
                <p class="text-sm text-gray-700 text-center text-primary/80">This session doesn’t have a playable URL yet.</p>
              </div>

              <p v-if="selectedSession?.description" class="mt-4 text-sm text-gray-600">
                {{ selectedSession.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Session Expired Modal -->
        <div
          v-if="sessionExpiredModalOpen"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Session expired"
          @click.self="sessionExpiredModalOpen = false"
        >
          <div class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <h2 class="text-lg font-semibold text-primary">Session expired</h2>
              <button
                type="button"
                class="rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:text-primary/60"
                @click="sessionExpiredModalOpen = false; if (!viewAllDialog && !sessionModalOpen && process.client) document.documentElement.style.overflow = ''"
              >
                Close
              </button>
            </header>

            <div class="p-6">
              <p class="text-sm text-gray-700">
                {{ sessionExpiredMessage }}
              </p>

              <div class="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  class="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  @click="sessionExpiredModalOpen = false; if (!viewAllDialog && !sessionModalOpen && process.client) document.documentElement.style.overflow = ''"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  class="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                  @click="clearSessionAndRedirect"
                >
                  Sign in again
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </NuxtLayout>
</template>

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

.pattern-icon {
  font-size: 1.25rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.75);
}
</style>
