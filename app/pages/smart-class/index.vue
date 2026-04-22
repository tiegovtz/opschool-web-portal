<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNavigationStore } from "~/stores/navigationStore";
import apiDocs from "~/utilities/apiDocs";
import EmptyState from "~/components/common/EmptyState.vue";
import PaginationControls from "~/components/common/PaginationControls.vue";
import VidstackPlayer from "~/components/video-player/VidstackPlayer.vue";
import { CustomDropDownList } from "#components";
import CustomDate from "~/components/common/CustomDate.vue";

const canGoBack = ref(false);
const route = useRoute();
const pageLanguage = useHubPageLanguage();
const isSw = computed(() => pageLanguage.value === "kiswahili");
const navigationStore = useNavigationStore();
const router = useRouter();
const redirectToAuth = () =>
  router.push({
    path: "/auth",
    query: { redirect: route.fullPath },
  });

const smartText = computed(() => ({
  back: isSw.value ? "Rudi" : "Back",
  smartClassHub: isSw.value ? "Kituo cha Darasa Janja" : "Smart Class Hub",
  heroTitle: isSw.value ? "Jifunze Mubashara, Tazama Tena, au Unganika" : "Learn Live, Rewatch, or Tune In",
  heroSummary: isSw.value ? "Jiunge na madarasa mubashara, tazama SomaKwanza TV, au fikia vipindi vilivyorekodiwa." : "Join live classes, watch SomaKwanza TV, or access your recorded sessions.",
  createClass: isSw.value ? "Unda darasa" : "Create class",
  liveClasses: isSw.value ? "Madarasa Mubashara" : "Live Classes",
  liveClassesNote: isSw.value ? "Vipindi vipya vinaanza karibuni" : "New sessions start soon",
  liveTvNote: isSw.value ? "Matangazo ya elimu mubashara" : "Live educational broadcasts",
  recordedSessions: isSw.value ? "Vipindi Vilivyorekodiwa" : "Recorded Sessions",
  recordedSessionsNote: isSw.value ? "Jifunze kwa kasi yako" : "Learn at your own pace",
  liveClassrooms: isSw.value ? "Madarasa ya mubashara" : "Live classrooms",
  liveClassroomsSummary: isSw.value ? "Jiunge na masomo ya moja kwa moja." : "Join interactive lessons in real time.",
  recordedLibrary: isSw.value ? "Maktaba ya vipindi" : "Recorded library",
  recordedLibrarySummary: isSw.value ? "Rudia masomo ya zamani." : "Revisit past lessons.",
  active: isSw.value ? "Mubashara" : "Active",
  pastSessions: isSw.value ? "Vipindi Vilivyopita" : "Past Sessions",
  all: isSw.value ? "Vyote" : "All",
  today: isSw.value ? "Leo" : "Today",
  tomorrow: isSw.value ? "Kesho" : "Tomorrow",
  thisWeek: isSw.value ? "Wiki hii" : "This week",
  searchLive: isSw.value ? "Tafuta madarasa mubashara..." : "Search live classes...",
  searchRecorded: isSw.value ? "Tafuta vipindi vilivyorekodiwa..." : "Search recorded sessions...",
  upcomingSession: isSw.value ? "Kipindi kijacho" : "Upcoming session",
  live: isSw.value ? "Mubashara" : "Live",
  noDescription: isSw.value ? "Hakuna maelezo yaliyowekwa." : "No description available.",
  noLiveClassesYet: isSw.value ? "Hakuna madarasa mubashara bado" : "No live classes yet",
  noRecordedSessions: isSw.value ? "Hakuna vipindi vilivyorekodiwa" : "No recorded sessions",
  noRecordedSessionsDescription: isSw.value ? "Masomo yakisharekodiwa yataonekana hapa." : "Once lessons are recorded they will appear in this library.",
  tvUnavailable: isSw.value ? "Mtiririko wa TV haupatikani" : "TV stream unavailable",
  tvUnavailableDescription: isSw.value ? "SomaKwanza TV haitangazi kwa sasa." : "SomaKwanza TV is not broadcasting at the moment.",
  noMatchingLiveClasses: isSw.value ? "Hakuna darasa linalolingana" : "No matching live classes",
  noMatchingRecordedSessions: isSw.value ? "Hakuna kipindi kinacholingana" : "No matching recorded sessions",
  tryAnotherKeyword: isSw.value ? "Jaribu neno jingine kutafuta kipindi kilichorekodiwa." : "Try another keyword to find a recorded session.",
  noClassesToday: isSw.value ? "Hakuna madarasa leo" : "No classes today",
  noClassesTodayDescription: isSw.value ? "Hakuna madarasa mubashara yaliyopangwa leo." : "There are no live classes scheduled for today.",
  noClassesTomorrow: isSw.value ? "Hakuna madarasa kesho" : "No classes tomorrow",
  noClassesTomorrowDescription: isSw.value ? "Hakuna madarasa mubashara yaliyopangwa kesho." : "There are no live classes scheduled for tomorrow.",
  noClassesThisWeek: isSw.value ? "Hakuna madarasa wiki hii" : "No classes this week",
  noClassesThisWeekDescription: isSw.value ? "Hakuna madarasa mubashara yaliyopangwa wiki hii." : "There are no live classes scheduled for this week.",
  noActiveClasses: isSw.value ? "Hakuna darasa mubashara sasa" : "No active classes",
  noActiveClassesDescription: isSw.value ? "Hakuna darasa mubashara linaloendelea sasa hivi." : "There are no live classes happening right now.",
  itemLabelLive: isSw.value ? "madarasa mubashara" : "live classes",
  itemLabelRecorded: isSw.value ? "vipindi vilivyorekodiwa" : "recorded sessions",
  customLiveAria: isSw.value ? "Ukubwa maalum wa ukurasa wa madarasa mubashara" : "Custom live classes page size",
  customRecordedAria: isSw.value ? "Ukubwa maalum wa ukurasa wa vipindi vilivyorekodiwa" : "Custom recorded sessions page size",
  createLiveClass: isSw.value ? "Unda Darasa la Mubashara" : "Create Live Class",
  closeButton: isSw.value ? "Funga" : "Close button",
  selectClass: isSw.value ? "Chagua darasa" : "Select class",
  selectSubject: isSw.value ? "Chagua somo" : "Select subject",
  selectTopic: isSw.value ? "Chagua mada" : "Select topic",
  startTime: isSw.value ? "Muda wa kuanza" : "Start time",
  endTime: isSw.value ? "Muda wa kumaliza" : "End time",
  startDateTime: isSw.value ? "Chagua tarehe na muda wa kuanza" : "Select start date & time",
  endDateTime: isSw.value ? "Chagua tarehe na muda wa kumaliza" : "Select end date & time",
  roomName: isSw.value ? "Jina la chumba" : "Room name",
  schoolRegistrationNumber: isSw.value ? "Namba ya usajili wa shule" : "School registration number",
  details: isSw.value ? "Maelezo" : "Details",
  describeSession: isSw.value ? "Eleza kipindi kwa kifupi" : "Briefly describe the session",
  cancel: isSw.value ? "Ghairi" : "Cancel",
  creating: isSw.value ? "Inaunda..." : "Creating...",
  session: isSw.value ? "Kipindi" : "Session",
  instructor: isSw.value ? "Mwalimu" : "Instructor",
  sessionSummary: isSw.value ? "Muhtasari wa kipindi" : "Session summary",
  checking: isSw.value ? "Inakagua..." : "Checking...",
  play: isSw.value ? "Cheza" : "Play",
  joinSession: isSw.value ? "Jiunge na kipindi" : "Join Session",
  preparingVideo: isSw.value ? "Inaandaa video..." : "Preparing video...",
  preparingLiveClass: isSw.value ? "Inaandaa darasa mubashara..." : "Preparing live class...",
  playPause: isSw.value ? "Cheza/Sitisha" : "Play/Pause",
  muteUnmute: isSw.value ? "Nyamazisha/Rudisha sauti" : "Mute/Unmute",
  fullscreen: isSw.value ? "Skrini nzima" : "Fullscreen",
  liveClassUnavailable: isSw.value ? "Darasa mubashara halipatikani." : "Live class not available.",
  sessionExpired: isSw.value ? "Muda wa kikao umeisha" : "Session expired",
  signInAgain: isSw.value ? "Ingia tena" : "Sign in again",
  sessionExpiredMessage: isSw.value ? "Muda wa kikao chako umeisha. Tafadhali ingia tena." : "Your session has expired. Please sign in again.",
}));

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
  topicId?: string;
  topicLoading?: boolean;
  duration?: string;
  time?: string;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
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

const authAccessTokenCookie =  useCookie("signInAccessToken");
const authUserTokenCookie = useCookie("signInUserToken");
const accessToken = computed(() => String(authAccessTokenCookie.value || "").trim());
const currentUser = computed(() => authUserTokenCookie.value as Record<string, any> | null);
const isTeacherAdmin = computed(() => currentUser.value?.roles?.includes("TeacherAdmin"));

const liveCards = ref<SessionCard[]>([]);
const recordedCards = ref<SessionCard[]>([]);
const isLoadingCards = ref(false);

/**
 * Session-expired modal (shows on any 401 from requests on this page)
 */
const sessionExpiredModalOpen = ref(false);
const sessionExpiredMessage = ref(smartText.value.sessionExpiredMessage);

const openSessionExpiredModal = (message?: string) => {
  // Avoid spamming if multiple requests fail at the same time
  if (sessionExpiredModalOpen.value) return;

  rememberCurrentFocus();
  announceForScreenReader(isSw.value ? "Dirisha la muda wa kikao kuisha limefunguliwa." : "Session expired dialog opened.");
  sessionExpiredMessage.value = message || smartText.value.sessionExpiredMessage;
  sessionExpiredModalOpen.value = true;

  // Close other modals for clarity (optional)
  sessionModalOpen.value = false;
  selectedSession.value = null;

  if (process.client) document.documentElement.style.overflow = "hidden";
  focusModalContainer(() => sessionExpiredModalRef.value);
};

const clearSessionAndRedirect = async () => {
  // Clear cookies
  authAccessTokenCookie.value = null;
  authUserTokenCookie.value = null;

  sessionExpiredModalOpen.value = false;
  if (process.client) document.documentElement.style.overflow = "";

  await redirectToAuth();
};

const streamHeaders = computed(() => ({
  accept: "application/json",
  ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}),
}));

const somakwanzaStreamUrl = ref("https://tv.somakwanza.tz");
const somakwanzaStreamMeta = ref({
  title: "SomaKwanza TV",
  description: "Educational live broadcast.",
});
const somakwanzaLoading = ref(true);
const somakwanzaError = ref(false);
const somakwanzaReady = ref(false);
const somaPlaybackRate = ref(1);
const somaPollIntervalMs = 1000;
const somaRecoverDelayMs = 1500;
const somaPollId = ref<ReturnType<typeof setInterval> | null>(null);
const somaRecoverTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null);
const somaIsRecovering = ref(false);

const defaultRecordingThumbnail = "https://media.istockphoto.com/id/2217581452/photo/podcast-broadcasting-studio-equipment.webp?a=1&b=1&s=612x612&w=0&k=20&c=BUm5U7iKNGKKXBjc3nqh-YKOVEwGOhE5mWV3x7_xaCY="
const defaultThumbnail =
  `https://media.istockphoto.com/id/1425207399/photo/book-sign-3d-render-concept-for-study-earn-knowledge-reading-and.webp?a=1&b=1&s=612x612&w=0&k=20&c=c94CC40l2cSPQARpJLbGK8J8u9EfEYUQzVe41xr0G6A=`;

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    accept: "application/json",
  };

  if (accessToken.value) {
    headers.Authorization = `Bearer ${accessToken.value}`;
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

const buildAssetUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${apiDocs.baseURL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const buildGradient = (subject?: string | null) => {
  const key = (subject ?? "default").toString().toLowerCase().replace(/\s+/g, "-");
  const fallbackPalette: [string, string] = ["#38BDF8", "#6366F1"];
  const palette: [string, string] = subjectPalettes[key] ?? subjectPalettes.default ?? fallbackPalette;
  const [primaryColor, secondaryColor] = palette;
  return `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
};

const getSubjectInitials = (label?: string | null) => {
  if (!label) return "SC";
  const words = label.trim().split(" ").filter(Boolean);
  if (words.length === 0) return "SC";
  if (words.length === 1) {
    const firstWord = words[0] ?? "";
    return firstWord.substring(0, 2).toUpperCase();
  }
  const [first, second] = words;
  const firstChar = first?.[0] ?? "";
  const secondChar = second?.[0] ?? "";
  return (firstChar + secondChar).toUpperCase();
};

const isLikelyId = (value?: string | null) => {
  if (!value) return false;
  return /^[a-f0-9]{24}$/i.test(value.trim());
};

const topicNameCache = ref<Record<string, string>>({});
const pendingTopicIds = new Set<string>();

const updateCardsWithTopicName = (topicId: string, name: string) => {
  if (!topicId || !name) return;
  liveCards.value = liveCards.value.map((card) =>
    card.topicId === topicId ? { ...card, title: name, topicLoading: false } : card
  );
};

const fetchTopicName = async (topicId: string) => {
  if (!topicId || pendingTopicIds.has(topicId) || topicNameCache.value[topicId]) return;
  pendingTopicIds.add(topicId);
  try {
    const headers = getHeaders();
    const url = apiDocs.topics.getTopicId.replace(":id", topicId);
    const data: any = await $fetch(url, { headers });
    const name = data?.name || data?.title || "";
    if (name) {
      topicNameCache.value = { ...topicNameCache.value, [topicId]: name };
      updateCardsWithTopicName(topicId, name);
    }
  } catch (error) {
    console.error("Failed to resolve topic name:", error);
  } finally {
    pendingTopicIds.delete(topicId);
  }
};

const mapLiveSessionToCard = (session: any): SessionCard => {
  const instructor =
    session?.teacherId?.name || session?.teacherName || session?.teacher?.name || "Teacher";
  const start = session?.start_time || session?.startTime;
  const end = session?.end_time || session?.endTime;

  const subjectLabel =
    typeof session?.subject === "object" ? session.subject?.name : session?.subject;

  const schoolLabel =
    session?.school_class?.name || session?.school_class || session?.schoolClass || session?.school;

  const badge = session?.subject ? session.subject?.name : "";

  const rawTitle = session?.topic || session?.title || "";
  const topicId =
    session?.topic?._id ||
    session?.topicId ||
    (typeof session?.topic === "string" ? session.topic : "");
  let safeTitle = rawTitle && !isLikelyId(rawTitle) ? rawTitle : "";
  let topicLoading = false;
  if (!safeTitle && topicId && topicNameCache.value[topicId]) {
    safeTitle = topicNameCache.value[topicId];
  }
  if (!safeTitle && topicId) {
    fetchTopicName(topicId);
    topicLoading = true;
  }
  if (!safeTitle) safeTitle = isSw.value ? "Kipindi cha mubashara" : "Live Session";

  return {
    id: session?._id,
    title: safeTitle,
    instructor,
    thumbnail: session?.thumbnail || defaultThumbnail,
    category: schoolLabel || (isSw.value ? "Jumla" : "General"),
    subject: subjectLabel || (isSw.value ? "Jumla" : "General"),
    topicId,
    topicLoading,
    duration: deriveDuration(start, end),
    description: session?.details || session?.description || (isSw.value ? "Somo la mubashara la maingiliano" : "Interactive live lesson"),
    time: formatSessionTime(start),
    createdAt: session?.createdAt || session?.updatedAt || start,
    startTime: start,
    endTime: end,
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
    isSw.value ? "Kimehifadhiwa" : "Recorded";

  const subjectLabel =
    (typeof session?.subject === "object" ? session.subject?.name : session?.subject) || classLabel;

  const timestamp = session?.createdAt || session?.updatedAt || video?.createdAt || video?.updatedAt;

  return {
    id: session?._id ?? session?.videoId ?? session?.id,
    title: session?.title || video?.name || (isSw.value ? "Kipindi kilichorekodiwa" : "Recorded Session"),
    instructor: session?.teacher?.name || session?.teacherName || session?.teacher_name || "SomaKwanza",
    thumbnail: defaultRecordingThumbnail,
    category: classLabel,
    subject: subjectLabel,
    duration: session?.duration || video?.duration || (isSw.value ? "Kimehifadhiwa" : "Recorded"),
    description: session?.description || session?.details || video?.description || (isSw.value ? "Rejea inapatikana" : "Replay available"),
    time: formatSessionTime(timestamp),
    createdAt: timestamp,
    badge: isSw.value ? "Kimehifadhiwa" : "Recorded",
    subjectGradient: buildGradient(subjectLabel ?? classLabel),
    subjectInitials: getSubjectInitials(subjectLabel ?? classLabel),
    recordingUrl: buildAssetUrl(video?.videoFileUrl || session?.recordingUrl || session?.videoFileUrl) || "",
  };
};

const handleUnauthorized = (error: unknown) => {
  const payload = error as Record<string, any> | undefined;
  const status = payload?.status || payload?.response?.status || payload?.statusCode;

  if (status === 401) {
    openSessionExpiredModal(smartText.value.sessionExpiredMessage);
  }
};

const fetchLiveCards = async () => {
  try {
    const headers = getHeaders();
    const response: any = await $fetch(`${apiDocs.liveClassrooms.sessions}`, {
      headers,
    });

    const items = normalizeList(response);
    const sorted = [...items].sort((a, b) => {
      const aTime = new Date(a?.createdAt || a?.updatedAt || a?.start_time || 0).getTime();
      const bTime = new Date(b?.createdAt || b?.updatedAt || b?.start_time || 0).getTime();
      return bTime - aTime;
    });
    liveCards.value = sorted.map(mapLiveSessionToCard);
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
      query: { isRecorded: true },
    });

    const items = normalizeList(response);
    const sorted = [...items].sort((a, b) => {
      const aTime = new Date(a?.createdAt || a?.updatedAt || a?.video?.createdAt || a?.video?.updatedAt || 0).getTime();
      const bTime = new Date(b?.createdAt || b?.updatedAt || b?.video?.createdAt || b?.video?.updatedAt || 0).getTime();
      return bTime - aTime;
    });
    recordedCards.value = sorted.map(mapRecordedSessionToCard);
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

const loadSomaStream = async (options?: { silent?: boolean }) => {
  const silent = !!options?.silent;
  try {
    if (!silent) {
      somakwanzaLoading.value = true;
      somakwanzaError.value = false;
      somakwanzaReady.value = false;
    }
    const response: any = await $fetch(`${apiDocs.liveClassrooms.streamingLinks}`, {
      headers: streamHeaders.value,
    });

    const streamItems = Array.isArray(response) ? response : response?.items ?? response?.data ?? [];
    const activeLink = (Array.isArray(streamItems) ? streamItems : []).find(
      (link) => link?.is_active || link?.isActive
    );

    if (activeLink) {
      const latestUrl =
        activeLink.url ||
        activeLink.streamUrl ||
        activeLink.link ||
        activeLink.streamingUrl ||
        somakwanzaStreamUrl.value;

      somakwanzaStreamUrl.value = latestUrl;
      somakwanzaLoading.value = false;
      somakwanzaError.value = false;
      somakwanzaReady.value = !!latestUrl;

      somakwanzaStreamMeta.value = {
        title: activeLink.title || somakwanzaStreamMeta.value.title,
        description: activeLink.description || somakwanzaStreamMeta.value.description,
      };
    }
  } catch (err) {
    console.error("Failed to load SomaKwanza stream:", err);
    handleUnauthorized(err);
    if (!silent) somakwanzaError.value = true;
  } finally {
    if (!somakwanzaStreamUrl.value) {
      somakwanzaLoading.value = false;
    }
  }
};

const clearSomaRecoverTimeout = () => {
  if (!somaRecoverTimeoutId.value) return;
  clearTimeout(somaRecoverTimeoutId.value);
  somaRecoverTimeoutId.value = null;
};

const pollSomaStreamUrl = async () => {
  const targetUrl = somakwanzaStreamUrl.value;
  if (!targetUrl || !process.client) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Poll the actual stream URL, not the streamingLinks endpoint.
    await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      mode: "no-cors",
      signal: controller.signal,
    });
  } catch {
    // Keep URL polling observational only.
    // Do not trigger recovery from poll request failures (can fail due to CORS/network policy).
  } finally {
    clearTimeout(timeoutId);
  }
};

const recoverSomaStream = async () => {
  if (somaIsRecovering.value) return;
  somaIsRecovering.value = true;
  clearSomaRecoverTimeout();
  try {
    const wasReady = somakwanzaReady.value;
    if (!wasReady) somakwanzaLoading.value = true;
    somakwanzaError.value = false;
    // Only refetch streaming links if no URL is currently available.
    if (!somakwanzaStreamUrl.value) {
      await loadSomaStream({ silent: true });
    }
  } finally {
    somaIsRecovering.value = false;
  }
};

const scheduleSomaRecover = () => {
  if (somaRecoverTimeoutId.value) return;
  somaRecoverTimeoutId.value = setTimeout(() => {
    recoverSomaStream();
  }, somaRecoverDelayMs);
};

const startSomaPolling = () => {
  if (somaPollId.value || !process.client) return;
  somaPollId.value = setInterval(() => {
    pollSomaStreamUrl();
  }, somaPollIntervalMs);
};

const stopSomaPolling = () => {
  if (somaPollId.value) {
    clearInterval(somaPollId.value);
    somaPollId.value = null;
  }
  clearSomaRecoverTimeout();
};

const handleSomakwanzaError = () => {
  if (somakwanzaReady.value) return;
  somakwanzaLoading.value = false;
  somakwanzaError.value = true;
};

/* Create live class (TeacherAdmin only) */
const createDialogOpen = ref(false);
const createSubmitting = ref(false);
const createError = ref("");
const createSuccess = ref("");
const createModalRef = ref<HTMLElement | null>(null);

const classOptions = ref<Array<{ id: string; name: string }>>([]);
const subjectOptions = ref<Array<{ id: string; name: string }>>([]);
type TopicOption = { id: string; name: string; subjectId?: string };
const topicOptions = ref<TopicOption[]>([]);
const createOptionsLoading = ref(false);

const createForm = reactive({
  schoolClass: "",
  subject: "",
  topic: "",
  startTime: "",
  endTime: "",
  roomName: "",
  details: "",
  schoolRegistrationNumber: "",
});

const resetCreateForm = () => {
  createForm.schoolClass = "";
  createForm.subject = "";
  createForm.topic = "";
  createForm.startTime = "";
  createForm.endTime = "";
  createForm.roomName = "";
  createForm.details = "";
  createForm.schoolRegistrationNumber = "";
  createError.value = "";
  createSuccess.value = "";
};

const toIsoString = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const mapOptions = (items: any[]) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item?._id || item?.id || "",
      name: item?.name || item?.title || item?.label || "",
    }))
    .filter((item) => item.id && item.name);

const mapTopicOptions = (items: any[]): TopicOption[] =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item?._id || item?.id || "",
      name: item?.name || item?.title || item?.label || "",
      subjectId: item?.subject?._id || item?.subjectId || item?.subject_id || "",
    }))
    .filter((item) => item.id && item.name);

const fetchCreateOptions = async () => {
  if (!accessToken.value) return;
  createOptionsLoading.value = true;
  try {
    const headers = getHeaders();
    const [classesRes, subjectsRes, topicsRes] = await Promise.allSettled([
      $fetch(apiDocs.levels.getLevels, { headers }),
      $fetch(apiDocs.subjects.getPublicSubjects, { headers }),
      $fetch(apiDocs.topics.getTopics, { headers }),
    ]);

    classOptions.value =
      classesRes.status === "fulfilled" ? mapOptions(classesRes.value as any[]) : [];
    subjectOptions.value =
      subjectsRes.status === "fulfilled" ? mapOptions(subjectsRes.value as any[]) : [];
    topicOptions.value =
      topicsRes.status === "fulfilled" ? mapTopicOptions(topicsRes.value as any[]) : [];
  } catch (error) {
    console.error("Failed to load create session options:", error);
  } finally {
    createOptionsLoading.value = false;
  }
};

const getOptionName = (options: Array<{ id: string; name: string }>, id: string) =>
  options.find((option) => option.id === id)?.name || id;

const filteredTopicOptions = computed(() => {
  if (!createForm.subject) return topicOptions.value;
  return topicOptions.value.filter((topic) => topic.subjectId === createForm.subject);
});

watch(
  () => createForm.subject,
  () => {
    if (!createForm.topic) return;
    const stillValid = filteredTopicOptions.value.some((topic) => topic.id === createForm.topic);
    if (!stillValid) createForm.topic = "";
  }
);

const openCreateDialog = () => {
  if (!isTeacherAdmin.value) return;
  resetCreateForm();
  rememberCurrentFocus();
  announceForScreenReader("Create live class dialog opened.");
  createDialogOpen.value = true;
  if (process.client) document.documentElement.style.overflow = "hidden";
  focusModalContainer(() => createModalRef.value);
};

const closeCreateDialog = () => {
  createDialogOpen.value = false;
  if (!sessionModalOpen.value && !sessionExpiredModalOpen.value && process.client) {
    document.documentElement.style.overflow = "";
  }
  restoreLastFocus();
};

const submitCreateSession = async () => {
  createError.value = "";
  createSuccess.value = "";

  if (!isTeacherAdmin.value) {
    createError.value = "You are not allowed to create sessions.";
    return;
  }

  if (
    !createForm.schoolClass ||
    !createForm.subject ||
    !createForm.topic ||
    !createForm.startTime ||
    !createForm.endTime ||
    !createForm.roomName ||
    !createForm.details
  ) {
    createError.value = "Please fill in all required fields.";
    return;
  }

  createSubmitting.value = true;
  try {
    const teacherId = currentUser.value?._id || currentUser.value?.id || "";
    const teacherName = currentUser.value?.name || "";
    const teacherEmail = currentUser.value?.email || currentUser.value?.username || "";

    const payload = {
      teacherId,
      teacherName,
      teacherEmail,
      topic: getOptionName(topicOptions.value, createForm.topic),
      startTime: toIsoString(createForm.startTime),
      endTime: toIsoString(createForm.endTime),
      schoolClass: createForm.schoolClass,
      subject: createForm.subject,
      roomName: createForm.roomName,
      details: createForm.details,
      schoolRegistrationNumber: createForm.schoolRegistrationNumber,
      isRecorded: false,
    };

    await $fetch(apiDocs.liveClassrooms.session, {
      method: "POST",
      headers: getHeaders(),
      body: payload,
    });

    createSuccess.value = isSw.value ? "Darasa la mubashara limeundwa kwa mafanikio." : "Live class created successfully.";
    await fetchLiveCards();
    closeCreateDialog();
  } catch (error: any) {
    console.error("Failed to create live class:", error);
    createError.value =
      error?.data?.message ||
      error?.response?._data?.message ||
      error?.message ||
      (isSw.value ? "Imeshindikana kuunda darasa la mubashara. Tafadhali jaribu tena." : "Failed to create live class. Please try again.");
  } finally {
    createSubmitting.value = false;
  }
};

/* Tabs */
const tabItems = computed<TabItem[]>(() => [
  {
    title: smartText.value.liveClasses,
    value: "live-classes",
    icon: "mdi:video",
    notifications: 3,
    availability: "",
    note: smartText.value.liveClassesNote,
  },
  {
    title: "SomaKwanza TV",
    value: "live-tv",
    icon: "mdi:television",
    notifications: 1,
    availability: "",
    note: smartText.value.liveTvNote,
  },
  {
    title: smartText.value.recordedSessions,
    value: "recorded-sessions",
    icon: "mdi:video-vintage",
    notifications: 0,
    availability: "",
    note: smartText.value.recordedSessionsNote,
  },
]);

const activeTab = ref<TabKey>("live-classes");
const activeItem = computed(() => tabItems.value.find((i) => i.value === activeTab.value) ?? tabItems.value[0] ?? {
  title: smartText.value.liveClasses,
  value: "live-classes" as TabKey,
  icon: "mdi:video",
  notifications: 0,
  availability: "",
  note: "",
});

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
    heading: smartText.value.liveClassrooms,
    summary: smartText.value.liveClassroomsSummary,
  },
  "live-tv": {
    heading: "SomaKwanza TV",
    summary: isSw.value ? "Matangazo ya elimu mubashara." : "Educational live broadcast.",
    streamUrl: somakwanzaStreamUrl.value,
    nowPlaying: somakwanzaStreamMeta.value.title,
    schedule: somakwanzaStreamMeta.value.description
      ? [somakwanzaStreamMeta.value.description]
      : [],
  },
  "recorded-sessions": {
    heading: smartText.value.recordedLibrary,
    summary: smartText.value.recordedLibrarySummary,
  },
}));

const activeTabPanel = computed<PanelConfig>(
  () => tabPanels.value[activeTab.value] ?? tabPanels.value["live-classes"]
);

type LiveFilterKey = "all" | "today" | "tomorrow" | "week" | "active" | "past";
const liveFilterGroups = computed<Array<Array<{ key: LiveFilterKey; label: string }>>>(() => [
  [
    { key: "active", label: smartText.value.active },
    { key: "past", label: smartText.value.pastSessions },
  ],
  [
    { key: "all", label: smartText.value.all },
    { key: "today", label: smartText.value.today },
    { key: "tomorrow", label: smartText.value.tomorrow },
    { key: "week", label: smartText.value.thisWeek },
  ],
]);
const activeLiveFilter = ref<LiveFilterKey>("all");

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfWeek = (date: Date) => {
  const value = new Date(date);
  const day = value.getDay(); // 0 (Sun) - 6 (Sat)
  value.setDate(value.getDate() - day);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfWeek = (date: Date) => {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  value.setHours(23, 59, 59, 999);
  return value;
};

const getSessionStatus = (card: SessionCard) => {
  const now = new Date();
  const start = card.startTime ? new Date(card.startTime) : null;
  const end = card.endTime ? new Date(card.endTime) : null;
  if (start && end && now >= start && now <= end) return "live";
  if (end && now > end) return "past";
  return "upcoming";
};

const formatDuration = (ms: number) => {
  if (ms <= 0) return "0 sec";
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = Math.floor(totalDays / 30);
  const totalYears = Math.floor(totalDays / 365);

  if (totalYears > 0) {
    const remainingDays = totalDays - totalYears * 365;
    const remainingMonths = Math.floor(remainingDays / 30);
    const parts = [
      `${totalYears} yr${totalYears > 1 ? "s" : ""}`,
      remainingMonths > 0 ? `${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}` : "",
    ].filter(Boolean);
    return parts.join(" ");
  }

  if (totalMonths > 0) {
    const remainingDays = totalDays - totalMonths * 30;
    const remainingHours = totalHours - totalDays * 24;
    const parts = [
      `${totalMonths} mo${totalMonths > 1 ? "s" : ""}`,
      remainingDays > 0 ? `${remainingDays} day${remainingDays > 1 ? "s" : ""}` : "",
      remainingHours > 0 && remainingDays === 0 ? `${remainingHours} hr${remainingHours > 1 ? "s" : ""}` : "",
    ].filter(Boolean);
    return parts.join(" ");
  }

  if (totalWeeks > 0) {
    const remainingDays = totalDays - totalWeeks * 7;
    const remainingHours = totalHours - totalDays * 24;
    const parts = [
      `${totalWeeks} wk${totalWeeks > 1 ? "s" : ""}`,
      remainingDays > 0 ? `${remainingDays} day${remainingDays > 1 ? "s" : ""}` : "",
      remainingHours > 0 && remainingDays === 0 ? `${remainingHours} hr${remainingHours > 1 ? "s" : ""}` : "",
    ].filter(Boolean);
    return parts.join(" ");
  }

  if (totalDays > 0) {
    const remainingHours = totalHours - totalDays * 24;
    const remainingMinutes = totalMinutes - totalHours * 60;
    const parts = [
      `${totalDays} day${totalDays > 1 ? "s" : ""}`,
      remainingHours > 0 ? `${remainingHours} hr${remainingHours > 1 ? "s" : ""}` : "",
      remainingMinutes > 0 && remainingHours === 0 ? `${remainingMinutes} min` : "",
    ].filter(Boolean);
    return parts.join(" ");
  }

  const hours = totalHours;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""} ${minutes > 0 ? `${minutes} min` : ""}`.trim();
  }
  if (minutes > 0) return `${minutes} min ${seconds > 0 ? `${seconds} sec` : ""}`.trim();
  return `${seconds} sec`;
};

const getTimeLeftLabel = (card: SessionCard) => {
  const now = new Date();
  const start = card.startTime ? new Date(card.startTime) : null;
  const end = card.endTime ? new Date(card.endTime) : null;
  if (start && end && now >= start && now <= end) {
    return { label: smartText.value.live, isLive: true };
  }
  if (end && now > end) return { label: "Ended", isLive: false };
  if (start) {
    const diff = start.getTime() - now.getTime();
    return { label: `${formatDuration(diff)}`, isLive: false };
  }
  return { label: "TBD", isLive: false };
};

const liveSortedCards = computed(() =>
  [...liveCards.value].sort((a, b) => {
    const aStart = a.startTime ? new Date(a.startTime).getTime() : Number.POSITIVE_INFINITY;
    const bStart = b.startTime ? new Date(b.startTime).getTime() : Number.POSITIVE_INFINITY;
    return aStart - bStart;
  })
);

const liveFilteredCards = computed(() => {
  const now = new Date();
  const base = liveSortedCards.value;
  const filtered = base.filter((card) => {
    const start = card.startTime ? new Date(card.startTime) : null;
    const end = card.endTime ? new Date(card.endTime) : null;
    if (activeLiveFilter.value === "all") return true;
    if (activeLiveFilter.value === "today") {
      return start ? isSameDay(start, now) : false;
    }
    if (activeLiveFilter.value === "tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return start ? isSameDay(start, tomorrow) : false;
    }
    if (activeLiveFilter.value === "week") {
      if (!start) return false;
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      return start >= weekStart && start <= weekEnd;
    }
    if (activeLiveFilter.value === "active") {
      return start && end ? now >= start && now <= end : false;
    }
    if (activeLiveFilter.value === "past") {
      return end ? now > end : false;
    }
    return true;
  });

  return filtered;
});

const liveSearch = ref("");
const recordedSearch = ref("");
const livePage = ref(1);
const recordedPage = ref(1);
const livePageSize = ref(6);
const recordedPageSize = ref(6);
const pageSizeOptions = [6, 12, 24, 48];
const pageSizeDropdownOptions = pageSizeOptions.map((size) => ({
  id: String(size),
  name: `${size} per page`,
}));
const livePageSizeSelection = ref(String(livePageSize.value));
const recordedPageSizeSelection = ref(String(recordedPageSize.value));
const liveCustomPageSize = ref("");
const recordedCustomPageSize = ref("");

const applySessionSearch = (cards: SessionCard[], query: string) => {
  const value = query.trim().toLowerCase();
  if (!value) return cards;
  return cards.filter((card) => {
    const haystack = [
      card.title,
      card.instructor,
      card.subject,
      card.category,
      card.description,
      card.details,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(value);
  });
};

const liveSearchFilteredCards = computed(() => applySessionSearch(liveFilteredCards.value, liveSearch.value));
const recordedSortedCards = computed(() =>
  [...recordedCards.value].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  })
);
const recordedSearchFilteredCards = computed(() =>
  applySessionSearch(recordedSortedCards.value, recordedSearch.value)
);

const livePageCount = computed(() =>
  Math.max(1, Math.ceil(liveSearchFilteredCards.value.length / livePageSize.value))
);
const recordedPageCount = computed(() =>
  Math.max(1, Math.ceil(recordedSearchFilteredCards.value.length / recordedPageSize.value))
);

const livePaginatedCards = computed(() => {
  const start = (livePage.value - 1) * livePageSize.value;
  return liveSearchFilteredCards.value.slice(start, start + livePageSize.value);
});
const recordedPaginatedCards = computed(() => {
  const start = (recordedPage.value - 1) * recordedPageSize.value;
  return recordedSearchFilteredCards.value.slice(start, start + recordedPageSize.value);
});

const activeCards = computed(() => {
  if (activeTab.value === "live-classes") return livePaginatedCards.value;
  if (activeTab.value === "recorded-sessions") return recordedPaginatedCards.value;
  return [];
});

const emptyStateMessages: Record<TabKey, { title: string; description: string }> = {
  "live-classes": {
    title: smartText.value.noLiveClassesYet,
    description: "New live lessons will appear here when scheduled.",
  },
  "recorded-sessions": {
    title: smartText.value.noRecordedSessions,
    description: smartText.value.noRecordedSessionsDescription,
  },
  "live-tv": {
    title: smartText.value.tvUnavailable,
    description: smartText.value.tvUnavailableDescription,
  },
};

const currentEmptyStateMessage = computed(() => {
  if (activeTab.value === "live-classes" && liveSearch.value.trim()) {
    return {
      title: smartText.value.noMatchingLiveClasses,
      description: "Try another keyword to find a live class.",
    };
  }
  if (activeTab.value === "recorded-sessions" && recordedSearch.value.trim()) {
    return {
      title: "No matching recordings",
      description: smartText.value.tryAnotherKeyword,
    };
  }
  if (activeTab.value !== "live-classes") return emptyStateMessages[activeTab.value];
  switch (activeLiveFilter.value) {
    case "today":
      return {
        title: smartText.value.noClassesToday,
        description: smartText.value.noClassesTodayDescription,
      };
    case "tomorrow":
      return {
        title: smartText.value.noClassesTomorrow,
        description: smartText.value.noClassesTomorrowDescription,
      };
    case "week":
      return {
        title: smartText.value.noClassesThisWeek,
        description: smartText.value.noClassesThisWeekDescription,
      };
    case "active":
      return {
        title: smartText.value.noActiveClasses,
        description: smartText.value.noActiveClassesDescription,
      };
    case "past":
      return {
        title: "No past sessions",
        description: "There are no past live sessions to show yet.",
      };
    default:
      return emptyStateMessages["live-classes"];
  }
});
const shouldShowEmptyState = computed(
  () =>
    !isLoadingCards.value &&
    activeTab.value !== "live-tv" &&
    ((activeTab.value === "live-classes" && liveSearchFilteredCards.value.length === 0) ||
      (activeTab.value === "recorded-sessions" && recordedSearchFilteredCards.value.length === 0))
);
const setLivePage = (value: number) => {
  livePage.value = Math.min(Math.max(value, 1), livePageCount.value);
};
const setRecordedPage = (value: number) => {
  recordedPage.value = Math.min(Math.max(value, 1), recordedPageCount.value);
};
const handlePaginationPrev = () => {
  if (activeTab.value === "live-classes") {
    setLivePage(livePage.value - 1);
    return;
  }
  setRecordedPage(recordedPage.value - 1);
};
const handlePaginationNext = () => {
  if (activeTab.value === "live-classes") {
    setLivePage(livePage.value + 1);
    return;
  }
  setRecordedPage(recordedPage.value + 1);
};
const handlePaginationPageSizeSelection = (value: string) => {
  if (activeTab.value === "live-classes") {
    livePageSizeSelection.value = value;
    return;
  }
  recordedPageSizeSelection.value = value;
};
const handlePaginationCustomPageSize = (value: string) => {
  if (activeTab.value === "live-classes") {
    liveCustomPageSize.value = value;
    return;
  }
  recordedCustomPageSize.value = value;
};

watch([activeLiveFilter, liveSearch, livePageSize], () => {
  livePage.value = 1;
});
watch([recordedSearch, recordedPageSize], () => {
  recordedPage.value = 1;
});
watch(activeTab, (tab) => {
  if (tab === "live-classes") livePage.value = 1;
  if (tab === "recorded-sessions") recordedPage.value = 1;
});
watch(livePageCount, (count) => {
  if (livePage.value > count) livePage.value = count;
});
watch(recordedPageCount, (count) => {
  if (recordedPage.value > count) recordedPage.value = count;
});
watch(livePageSizeSelection, (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return;
  livePageSize.value = parsed;
  if (liveCustomPageSize.value) liveCustomPageSize.value = "";
});
watch(recordedPageSizeSelection, (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return;
  recordedPageSize.value = parsed;
  if (recordedCustomPageSize.value) recordedCustomPageSize.value = "";
});
watch(liveCustomPageSize, (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return;
  livePageSize.value = parsed;
});
watch(recordedCustomPageSize, (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return;
  recordedPageSize.value = parsed;
});

/* Session Player Modal */
const sessionModalOpen = ref(false);
const selectedSession = ref<SessionCard | null>(null);
const sessionModalRef = ref<HTMLElement | null>(null);
const joinRequested = ref(false);
const meetingLoading = ref(false);
const meetingReady = ref(false);
const meetingCheckLoading = ref(false);
const meetingPlayable = ref(false);
const meetingTimedOut = ref(false);
const meetingTimeoutMs = 10000;
const meetingTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null);
const recordedPlayerRef = ref<HTMLVideoElement | null>(null);
const recordedPlaybackRate = ref(1);
const sessionExpiredModalRef = ref<HTMLElement | null>(null);
const lastFocusedElement = ref<HTMLElement | null>(null);
const srAnnouncement = ref("");
const srAnnouncementTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null);

const announceForScreenReader = (message: string) => {
  if (!process.client) return;
  srAnnouncement.value = "";
  if (srAnnouncementTimeoutId.value) {
    clearTimeout(srAnnouncementTimeoutId.value);
  }
  srAnnouncementTimeoutId.value = setTimeout(() => {
    srAnnouncement.value = message;
  }, 60);
};

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container || !process.client) return [] as HTMLElement[];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
};

const rememberCurrentFocus = () => {
  if (!process.client) return;
  lastFocusedElement.value = document.activeElement as HTMLElement | null;
};

const restoreLastFocus = () => {
  if (!process.client) return;
  if (createDialogOpen.value || sessionModalOpen.value || sessionExpiredModalOpen.value) return;
  const target = lastFocusedElement.value;
  if (target && document.contains(target)) target.focus();
  lastFocusedElement.value = null;
};

const focusModalContainer = async (resolveContainer: () => HTMLElement | null) => {
  if (!process.client) return;
  await nextTick();
  const container = resolveContainer();
  if (!container) return;
  const focusable = getFocusableElements(container);
  (focusable[0] ?? container).focus();
};

const trapFocusInModal = (container: HTMLElement | null, event: KeyboardEvent) => {
  if (!container || event.key !== "Tab") return;
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && (active === first || !active || !container.contains(active))) {
    event.preventDefault();
    last?.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first?.focus();
  }
};

const openSessionModal = (card: SessionCard) => {
  rememberCurrentFocus();
  announceForScreenReader(isSw.value ? "Dirisha la kipindi limefunguliwa." : "Session player dialog opened.");
  selectedSession.value = card;
  sessionModalOpen.value = true;
  joinRequested.value = false;
  meetingLoading.value = false;
  meetingReady.value = false;
  meetingCheckLoading.value = false;
  meetingPlayable.value = false;
  meetingTimedOut.value = false;
  if (meetingTimeoutId.value) {
    clearTimeout(meetingTimeoutId.value);
    meetingTimeoutId.value = null;
  }
  if (process.client) document.documentElement.style.overflow = "hidden";
  focusModalContainer(() => sessionModalRef.value);
};

const closeSessionModal = () => {
  sessionModalOpen.value = false;
  selectedSession.value = null;
  joinRequested.value = false;
  meetingLoading.value = false;
  meetingReady.value = false;
  meetingCheckLoading.value = false;
  meetingPlayable.value = false;
  meetingTimedOut.value = false;
  if (meetingTimeoutId.value) {
    clearTimeout(meetingTimeoutId.value);
    meetingTimeoutId.value = null;
  }
  if (!sessionExpiredModalOpen.value && process.client) {
    document.documentElement.style.overflow = "";
  }
  restoreLastFocus();
};

const closeSessionExpiredModal = () => {
  sessionExpiredModalOpen.value = false;
  if (!sessionModalOpen.value && process.client) {
    document.documentElement.style.overflow = "";
  }
  restoreLastFocus();
};

const playableUrl = computed(() => {
  if (!selectedSession.value) return "";
  if (selectedSession.value.recordingUrl) return selectedSession.value.recordingUrl;
  if (selectedSession.value.streamUrl) return selectedSession.value.streamUrl;
  return "";
});

const isRecordedSelected = computed(
  () => selectedSession.value?.badge === "Recorded" || !!selectedSession.value?.recordingUrl
);

const isSelectedLiveSessionJoinable = computed(() => {
  if (!selectedSession.value || isRecordedSelected.value) return true;
  const start = selectedSession.value.startTime ? new Date(selectedSession.value.startTime) : null;
  const end = selectedSession.value.endTime ? new Date(selectedSession.value.endTime) : null;
  if (!start || !end) return false;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  const now = new Date();
  return now >= start && now <= end;
});

const isSelectedLiveSessionEnded = computed(() => {
  if (!selectedSession.value || isRecordedSelected.value) return false;
  const end = selectedSession.value.endTime ? new Date(selectedSession.value.endTime) : null;
  if (!end || Number.isNaN(end.getTime())) return false;
  return new Date() > end;
});

const isMeetingDisplayable = computed(() => !!playableUrl.value || !!meetingEmbedUrl.value);

const startMeeting = async () => {
  meetingCheckLoading.value = true;
  meetingLoading.value = false;
  meetingReady.value = false;
  meetingPlayable.value = false;
  meetingTimedOut.value = false;
  if (meetingTimeoutId.value) {
    clearTimeout(meetingTimeoutId.value);
    meetingTimeoutId.value = null;
  }

  await Promise.resolve();
  meetingCheckLoading.value = false;

  meetingPlayable.value = isRecordedSelected.value ? !!playableUrl.value : isMeetingDisplayable.value;
  joinRequested.value = true;

  if (!meetingPlayable.value) return;

  meetingLoading.value = true;
  meetingTimeoutId.value = setTimeout(() => {
    if (meetingReady.value) return;
    meetingTimedOut.value = true;
    meetingPlayable.value = false;
    meetingLoading.value = false;
  }, meetingTimeoutMs);
};

const handleMeetingReady = () => {
  if (meetingTimeoutId.value) {
    clearTimeout(meetingTimeoutId.value);
    meetingTimeoutId.value = null;
  }
  meetingLoading.value = false;
  meetingReady.value = true;
  if (recordedPlayerRef.value) {
    recordedPlayerRef.value.playbackRate = recordedPlaybackRate.value;
  }
};

const handlePlayerError = () => {
  if (meetingTimeoutId.value) {
    clearTimeout(meetingTimeoutId.value);
    meetingTimeoutId.value = null;
  }
  meetingTimedOut.value = true;
  meetingPlayable.value = false;
  meetingLoading.value = false;
  meetingReady.value = false;
};

type PlayerTarget = "soma" | "recorded";

const getPlayerElement = (target: PlayerTarget) =>
  target === "soma" ? null : recordedPlayerRef.value;

const togglePlayerPlayback = (target: PlayerTarget) => {
  const player = getPlayerElement(target);
  if (!player) return;
  if (player.paused) {
    player.play().catch(() => {});
    return;
  }
  player.pause();
};

const togglePlayerMute = (target: PlayerTarget) => {
  const player = getPlayerElement(target);
  if (!player) return;
  player.muted = !player.muted;
};

const seekPlayer = (target: PlayerTarget, seconds: number) => {
  const player = getPlayerElement(target);
  if (!player) return;
  if (!Number.isFinite(player.duration)) return;
  const nextTime = player.currentTime + seconds;
  player.currentTime = Math.min(Math.max(nextTime, 0), player.duration);
};

const cyclePlaybackRate = (target: PlayerTarget) => {
  const rates = [0.5, 1, 1.25, 1.5, 2];
  const rateRef = target === "soma" ? somaPlaybackRate : recordedPlaybackRate;
  const currentIndex = rates.findIndex((rate) => rate === rateRef.value);
  const nextRate = rates[(currentIndex + 1) % rates.length] ?? 1;
  rateRef.value = nextRate;
  const player = getPlayerElement(target);
  if (player) player.playbackRate = nextRate;
};

const togglePlayerFullscreen = async (target: PlayerTarget) => {
  if (!process.client) return;
  const player = getPlayerElement(target);
  if (!player) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (player.requestFullscreen) {
    await player.requestFullscreen();
  }
};

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
  if (e.key === "Tab") {
    if (sessionExpiredModalOpen.value) {
      trapFocusInModal(sessionExpiredModalRef.value, e);
      return;
    }
    if (sessionModalOpen.value) {
      trapFocusInModal(sessionModalRef.value, e);
      return;
    }
    if (createDialogOpen.value) {
      trapFocusInModal(createModalRef.value, e);
      return;
    }
  }

  if (e.key === "Escape") {
    if (sessionExpiredModalOpen.value) {
      closeSessionExpiredModal();
      return;
    }
    if (sessionModalOpen.value) closeSessionModal();
    if (createDialogOpen.value) closeCreateDialog();
  }
};

onMounted(() => {
  canGoBack.value = window.history.length > 1;
  loadTabCards();
  loadSomaStream();
  startSomaPolling();
  fetchCreateOptions();
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  stopSomaPolling();
  if (srAnnouncementTimeoutId.value) {
    clearTimeout(srAnnouncementTimeoutId.value);
    srAnnouncementTimeoutId.value = null;
  }
});

const getItemPath = (value: TabKey) => `/smart-class/screen/${value}`;

const prepareNavigation = () => {
  navigationStore.setGoBack(route.fullPath);
};
</script>

<template>
    <NuxtLayout
    :name="$router.currentRoute.value.fullPath.includes('header-less') ? ('normal' as any) : ('home-layout' as any)"
    :language="$router.currentRoute.value.fullPath.includes('header-less') ? undefined : pageLanguage"
  >
    <main ref="pageRoot" id="main-container" tabindex="-1" class="min-h-screen bg-white font-sans text-gray-900">
      <p class="sr-only" aria-live="assertive" aria-atomic="true">{{ srAnnouncement }}</p>
      <div class="mx-auto w-full max-w-none px-0 sm:px-2 lg:max-w-7xl lg:px-4 py-8 sm:py-10">
        <!-- Back -->
        <NuxtLink v-if="canGoBack" to="/"
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-gray-50">
          <Icon name="mdi:arrow-left" size="18" />
          {{ smartText.back }}
        </NuxtLink>

        <!-- Header -->
        <header class="mb-8">
          <p class="text-xs uppercase tracking-widest text-gray-400">{{ smartText.smartClassHub }}</p>

          <h1 class="mt-2 text-3xl font-bold text-primary">{{ smartText.heroTitle }}</h1>

          <p class="mt-3 max-w-2xl text-gray-600">
            {{ smartText.heroSummary }}
          </p>
        </header>

        <!-- Main Card -->
        <section class="rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-3xl">
          <!-- Tabs -->
          <div class="border-b border-gray-200 p-3 sm:p-4">
            <div class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap" role="tablist">
              <button v-for="tab in tabItems" :key="tab.value" role="tab" type="button"
                :aria-selected="activeTab === tab.value" :class="[
                  activeTab === tab.value ? 'bg-primary text-white' : 'text-primary hover:bg-gray-100',
                  'flex w-full items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition sm:w-auto sm:justify-start',
                ]" @click="activeTab = tab.value">
                <Icon :name="tab.icon" size="18" />
                {{ tab.title }}
              </button>
            </div>
            <span class="mt-2 hidden text-right text-sm text-gray-500 md:block">
              {{ activeItem.availability }}
            </span>
          </div>

          <!-- Summary -->
          <div class="border-b border-gray-200 p-4 sm:p-6">
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

              <div v-if="activeTab !== 'live-tv'" class="flex w-full items-center justify-end gap-2 lg:w-auto">
                <button v-if="activeTab === 'live-classes' && isTeacherAdmin" type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  @click="openCreateDialog">
                  <Icon name="mdi:plus" size="18" />
                  Create class
                </button>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 sm:p-6">
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
              <div class="relative overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-md">
                <div class="flex items-center justify-between bg-gray-100 px-4 py-2">
                  <span class="text-sm font-semibold">SomaKwanza TV</span>
                  <span class="text-xs font-medium text-primary flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                <div v-if="activeTabPanel.streamUrl && !somakwanzaError" class="p-2 bg-black">
                  <VidstackPlayer
                    :src="activeTabPanel.streamUrl"
                    :title="activeTabPanel.nowPlaying || 'SomaKwanza TV'"
                    :auto-fullscreen-on-play-mobile="true"
                  />
                </div>

                <div v-if="activeTabPanel.streamUrl && somakwanzaLoading && !somakwanzaError"
                  class="absolute inset-0 z-10 flex items-center justify-center bg-black/40" role="status"
                  aria-live="polite">
                  <div class="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white"></div>
                </div>

                <div
                  v-if="!somakwanzaLoading && !somakwanzaReady && (!activeTabPanel.streamUrl || somakwanzaError)"
                  class="grid h-[420px] place-items-center text-gray-400">
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
              <div v-if="activeTab === 'live-classes'" class="mb-4" role="group" aria-label="Live class filters">
                <div class="flex gap-2 overflow-x-auto pb-2" role="list" aria-label="Live class filter chips">
                  <button
                    v-for="filter in liveFilterGroups[0]"
                    :key="filter.key"
                    type="button"
                    class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition"
                    :class="activeLiveFilter === filter.key ? 'bg-primary text-white' : 'border border-primary text-primary hover:bg-primary/10'"
                    :aria-pressed="activeLiveFilter === filter.key"
                    @click="activeLiveFilter = filter.key"
                  >
                    {{ filter.label }}
                  </button>
                  <span class="mx-1 my-auto h-6 w-px shrink-0 bg-primary/30" aria-hidden="true"></span>
                  <button
                    v-for="filter in liveFilterGroups[1]"
                    :key="filter.key"
                    type="button"
                    class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition"
                    :class="activeLiveFilter === filter.key ? 'bg-primary text-white' : 'border border-primary text-primary hover:bg-primary/10'"
                    :aria-pressed="activeLiveFilter === filter.key"
                    @click="activeLiveFilter = filter.key"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </div>

              <div class="mb-4 flex flex-wrap items-center gap-3">
                <div class="w-full min-w-0 flex-1">
                  <label class="sr-only" :for="activeTab === 'live-classes' ? 'live-search' : 'recorded-search'">
                    Search sessions
                  </label>
                  <input
                    v-if="activeTab === 'live-classes'"
                    id="live-search"
                    v-model="liveSearch"
                    type="search"
                    placeholder="Search live classes..."
                    class="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    v-else
                    id="recorded-search"
                    v-model="recordedSearch"
                    type="search"
                    placeholder="Search recorded sessions..."
                    class="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div v-if="shouldShowEmptyState">
                <EmptyState :title="currentEmptyStateMessage?.title"
                  :description="currentEmptyStateMessage?.description" />
              </div>

              <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
                <article v-for="card in activeCards" :key="card.id ?? card.title"
                  class="group rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  role="listitem" tabindex="0" @keydown.enter.prevent="openSessionModal(card)"
                  @keydown.space.prevent="openSessionModal(card)">
                  <!-- Image -->
                  <div class="relative h-44 overflow-hidden rounded-t-2xl bg-gray-100">
                    <img
                      v-if="card.thumbnail"
                      :src="card.thumbnail"
                      class="block h-full w-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                    />

                    <div v-else class="flex h-full w-full items-center justify-center subject-gradient"
                      :style="{ backgroundImage: card.subjectGradient }">
                      <span class="subject-gradient__initials">
                        {{ card.subjectInitials }}
                      </span>
                    </div>

                    <div class="subject-gradient-overlay" :style="{ backgroundImage: card.subjectGradient }"></div>

                    <!-- Play overlay -->
                    <button type="button"
                      class="absolute inset-0 z-10 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
                      aria-label="Play session" @click.stop="openSessionModal(card)">
                      <span
                        class="grid place-items-center rounded-full bg-white/90 p-3 shadow-lg transition group-hover:scale-110">
                        <Icon name="mdi:play-circle" size="44" class="text-primary" />
                      </span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="p-4">
                  <div v-if="card.topicLoading" class="space-y-2" aria-hidden="true">
                    <div class="h-4 w-3/4 rounded bg-gray-100 animate-pulse"></div>
                    <div class="h-3 w-1/2 rounded bg-gray-100 animate-pulse"></div>
                  </div>
                  <h3 v-else class="font-semibold">
                    {{ card.title || "Upcoming session" }}
                  </h3>

                    <p class="mt-1 text-sm text-gray-600">
                      {{ card.instructor || "SomaKwanza Teacher" }}
                    </p>

                    <div class="mt-3 flex flex-col items-start gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                      <span class="break-words">{{ card.subject ?? card.category }}</span>
                      <span v-if="activeTab === 'live-classes'" class="inline-flex items-center gap-1">
                        <span v-if="getTimeLeftLabel(card).isLive" class="inline-flex items-center gap-1 text-red-500">
                          <span class="live-dot h-2 w-2 rounded-full bg-red-500"></span>
                          <span class="live-text">Live</span>
                        </span>
                        <span v-else>{{ getTimeLeftLabel(card).label }}</span>
                      </span>
                      <span v-else>{{ card.time }}</span>
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

              <PaginationControls
                v-if="(activeTab === 'live-classes' && liveSearchFilteredCards.length > 0) || (activeTab === 'recorded-sessions' && recordedSearchFilteredCards.length > 0)"
                :showing="activeTab === 'live-classes' ? livePaginatedCards.length : recordedPaginatedCards.length"
                :total="activeTab === 'live-classes' ? liveSearchFilteredCards.length : recordedSearchFilteredCards.length"
                :item-label="activeTab === 'live-classes' ? 'live classes' : 'recorded sessions'"
                :page="activeTab === 'live-classes' ? livePage : recordedPage"
                :page-count="activeTab === 'live-classes' ? livePageCount : recordedPageCount"
                :page-size-selection="activeTab === 'live-classes' ? livePageSizeSelection : recordedPageSizeSelection"
                :custom-page-size="activeTab === 'live-classes' ? liveCustomPageSize : recordedCustomPageSize"
                :page-size-options="pageSizeDropdownOptions"
                :page-size-dropdown-id="activeTab === 'live-classes' ? 'live-page-size' : 'recorded-page-size'"
                :custom-input-placeholder="activeTab === 'live-classes' ? '6' : 'Custom'"
                :custom-input-aria-label="activeTab === 'live-classes' ? 'Custom live classes page size' : 'Custom recorded sessions page size'"
                @prev="handlePaginationPrev"
                @next="handlePaginationNext"
                @update:pageSizeSelection="handlePaginationPageSizeSelection"
                @update:customPageSize="handlePaginationCustomPageSize"
              />
            </div>
          </div>
        </section>

        <!-- Create Live Class Modal -->
        <div v-if="createDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10"
          role="dialog" aria-modal="true" aria-labelledby="create-class-title" @click.self="closeCreateDialog">
          <div ref="createModalRef" tabindex="-1" class="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <h2 id="create-class-title" class="text-lg font-semibold text-primary">Create Live Class</h2>
              <button type="button"
                class="rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:text-primary/60"
                aria-label="Close button"
                @click="closeCreateDialog">
                Close
              </button>
            </header>

            <div class="p-6">
              <div v-if="createOptionsLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden="true">
                <div class="md:col-span-2 h-11 rounded-lg bg-gray-100 animate-pulse"></div>
                <div class="h-11 rounded-lg bg-gray-100 animate-pulse"></div>
                <div class="h-11 rounded-lg bg-gray-100 animate-pulse"></div>
                <div class="h-11 rounded-lg bg-gray-100 animate-pulse"></div>
                <div class="h-11 rounded-lg bg-gray-100 animate-pulse"></div>
                <div class="h-11 rounded-lg bg-gray-100 animate-pulse"></div>
                <div class="h-11 rounded-lg bg-gray-100 animate-pulse"></div>
                <div class="md:col-span-2 h-24 rounded-lg bg-gray-100 animate-pulse"></div>
                <div class="md:col-span-2 flex justify-end gap-3">
                  <div class="h-10 w-28 rounded-full bg-gray-100 animate-pulse"></div>
                  <div class="h-10 w-32 rounded-full bg-gray-100 animate-pulse"></div>
                </div>
              </div>

              <form v-else class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="submitCreateSession"
                aria-live="polite">
                <div class="md:col-span-2">
                  <label class="mb-1 block text-sm font-medium text-gray-700" for="create-school-class">
                    School class
                  </label>
                  <CustomDropDownList id="create-school-class" v-model="createForm.schoolClass"
                    buttonClass="w-full rounded-lg p-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    :list="classOptions" placeholder="Select class" :disabled="createOptionsLoading" />
                </div>

                <div class="w-full">
                  <label class="mb-1 block text-sm font-medium text-gray-700" for="create-subject">
                    Subject
                  </label>
                  <CustomDropDownList id="create-subject" v-model="createForm.subject"
                    buttonClass="w-full rounded-lg p-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    :list="subjectOptions" placeholder="Select subject" :disabled="createOptionsLoading" />
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700" for="create-topic">
                    Topic
                  </label>
                  <CustomDropDownList id="create-topic" v-model="createForm.topic"
                    buttonClass="w-full rounded-lg p-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    :list="filteredTopicOptions" placeholder="Select topic" :disabled="createOptionsLoading" />
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">Start time</label>
                  <CustomDate v-model="createForm.startTime" placeholder="Select start date & time" required />
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">End time</label>
                  <CustomDate v-model="createForm.endTime" placeholder="Select end date & time" required />
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">Room name</label>
                  <input v-model="createForm.roomName" type="text" placeholder="e.g. biology-room-12"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required />
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">School registration number</label>
                  <input v-model="createForm.schoolRegistrationNumber" type="text" placeholder="e.g. TZ-REG-12345"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>

                <div class="md:col-span-2">
                  <label class="mb-1 block text-sm font-medium text-gray-700">Details</label>
                  <textarea v-model="createForm.details" rows="3" placeholder="Briefly describe the session"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required />
                </div>

                <div class="md:col-span-2 flex flex-col gap-2" role="status" aria-live="polite">
                  <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
                  <p v-if="createSuccess" class="text-sm text-green-600">{{ createSuccess }}</p>
                </div>

                <div class="md:col-span-2 flex items-center justify-end gap-3">
                <button type="button"
                  class="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  aria-label="Close button"
                  @click="closeCreateDialog">
                  Cancel
                </button>
                  <button type="submit"
                    class="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="createSubmitting">
                    {{ createSubmitting ? "Creating..." : "Create class" }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Session Player Modal -->
        <div v-if="sessionModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10"
          role="dialog" aria-modal="true" aria-label="Session player" @click.self="closeSessionModal">
          <div ref="sessionModalRef" tabindex="-1" class="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold text-primary">
                  {{ selectedSession?.title || "Session" }}
                </h2>

                <p class="mt-1 text-sm text-gray-600">
                  <span class="block break-words md:inline">{{ selectedSession?.instructor || "Instructor" }}</span>
                  <span class="hidden md:inline"> • </span>
                  <span class="block md:inline">{{ selectedSession?.time || "TBD" }}</span>
                </p>
              </div>

              <button type="button"
                class="rounded-full border border-red-500 px-3 py-1.5 text-base font-semibold text-red-500 hover:bg-red-500 hover:text-white hover:border-white transition duration-500 ease-in-out"
                aria-label="Close button"
                @click="closeSessionModal">
                x
              </button>
            </header>

            <div class="p-6">
              <div v-if="!joinRequested" class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div class="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-start lg:gap-4">
                  <div class="h-40 w-full overflow-hidden rounded-lg md:h-48 lg:h-20 lg:w-20 lg:shrink-0">
                    <img
                      :src="selectedSession?.badge === 'Recorded' ? defaultRecordingThumbnail : defaultThumbnail"
                      alt=""
                      class="block h-full w-full rounded-lg object-cover object-center"
                      loading="lazy"
                      decoding="async"
                    >
                  </div>

                  <div>
                    <h3 class="text-base font-semibold text-gray-900">
                      {{ selectedSession?.title || "Session summary" }}
                    </h3>
                    <p class="mt-1 text-sm text-gray-600">
                      <span class="block break-words md:inline">{{ selectedSession?.instructor || "Instructor" }}</span>
                      <span class="hidden md:inline"> • </span>
                      <span class="block md:inline">{{ selectedSession?.time || "TBD" }}</span>
                    </p>
                    <p v-if="selectedSession?.description" class="mt-3 text-sm text-gray-700">
                      {{ selectedSession.description }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="!joinRequested && !isSelectedLiveSessionEnded" class="mt-4 flex items-center gap-3">
                <button type="button"
                  class="w-full rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="!selectedSession || meetingCheckLoading || (!isRecordedSelected && !isSelectedLiveSessionJoinable)" @click="startMeeting">
                  {{ meetingCheckLoading ? "Checking..." : (isRecordedSelected ? "Play" : "Join Session") }}
                </button>
              </div>
              <p
                v-if="!joinRequested && !isRecordedSelected && selectedSession && isSelectedLiveSessionEnded"
                class="mt-2 text-center text-sm font-medium text-gray-500"
              >
                This session has ended.
              </p>
              <p
                v-if="!joinRequested && !isRecordedSelected && selectedSession && !isSelectedLiveSessionJoinable && !isSelectedLiveSessionEnded"
                class="mt-2 text-center text-xs text-gray-500"
              >
                You will be able to join when this class is live.
              </p>

              <div v-if="joinRequested" class="mt-5">
                <div v-if="meetingPlayable" class="relative">
                  <div v-if="meetingLoading && !meetingReady"
                    class="flex h-[220px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
                    role="status" aria-live="polite">
                    <div class="flex items-center gap-3 text-sm text-gray-600">
                      <span class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></span>
                      {{ isRecordedSelected ? "Preparing video..." : "Preparing live class..." }}
                    </div>
                  </div>

                  <video
                    v-if="isRecordedSelected"
                    ref="recordedPlayerRef"
                    :src="playableUrl"
                    :class="meetingReady ? 'h-[420px] w-full rounded-xl bg-black' : 'h-0 w-0 opacity-0 pointer-events-none'"
                    controls
                    autoplay
                    playsinline
                    preload="metadata"
                    @loadeddata="handleMeetingReady"
                    @canplay="handleMeetingReady"
                    @error="handlePlayerError"
                  />

                  <div
                    v-if="isRecordedSelected && meetingReady && meetingPlayable"
                    class="mt-2 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <button type="button" class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300" @click="togglePlayerPlayback('recorded')">Play/Pause</button>
                    <button type="button" class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300" @click="seekPlayer('recorded', -10)">-10s</button>
                    <button type="button" class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300" @click="seekPlayer('recorded', 10)">+10s</button>
                    <button type="button" class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300" @click="togglePlayerMute('recorded')">Mute/Unmute</button>
                    <button type="button" class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300" @click="cyclePlaybackRate('recorded')">{{ recordedPlaybackRate }}x</button>
                    <button type="button" class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300" @click="togglePlayerFullscreen('recorded')">Fullscreen</button>
                  </div>

                  <iframe v-else-if="playableUrl" :src="playableUrl"
                    :class="meetingReady ? 'h-[420px] w-full rounded-xl bg-black' : 'h-0 w-0 opacity-0 pointer-events-none'"
                    controls autoplay playsinline loading="lazy" @load="handleMeetingReady" />

                  <iframe v-else :src="meetingEmbedUrl"
                    :class="meetingReady ? 'h-[420px] w-full rounded-xl bg-black' : 'h-0 w-0 opacity-0 pointer-events-none'"
                    allow="microphone; camera; autoplay; encrypted-media; picture-in-picture" allowfullscreen
                    loading="lazy" @load="handleMeetingReady" @error="handlePlayerError" />
                </div>

                <div v-else class="rounded-xl border-dashed border-primary bg-gray-50 p-6 min-h-[200px] flex items-center justify-center">
                  <p class="text-sm text-center text-gray-400">
                    Live class not available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Session Expired Modal -->
        <div v-if="sessionExpiredModalOpen"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-10" role="dialog"
          aria-modal="true" aria-label="Session expired" @click.self="closeSessionExpiredModal">
          <div ref="sessionExpiredModalRef" tabindex="-1" class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <h2 class="text-lg font-semibold text-primary">Session expired</h2>
              <button type="button"
                class="rounded-full border border-red-500 px-3 py-1.5 text-base font-semibold text-red-500 hover:bg-red-500 hover:text-white hover:border-white transition duration-500 ease-in-out"
                aria-label="Close button"
                @click="closeSessionExpiredModal">
                x
              </button>
            </header>

            <div class="p-6">
              <p class="text-sm text-gray-700">
                {{ sessionExpiredMessage }}
              </p>

              <div class="mt-5 flex items-center justify-end gap-3">
                <button type="button"
                  class="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  aria-label="Close button"
                  @click="closeSessionExpiredModal">
                  Cancel
                </button>

                <button type="button"
                  class="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                  @click="clearSessionAndRedirect">
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

.live-dot {
  animation: live-dot-pulse 1.4s ease-in-out infinite;
}

.live-text {
  animation: live-text-pulse 1.4s ease-in-out infinite;
}

@keyframes live-dot-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.55;
  }
}

@keyframes live-text-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
