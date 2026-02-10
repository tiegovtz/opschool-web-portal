<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNavigationStore } from "~/stores/navigationStore";
import apiDocs from "~/utilities/apiDocs";
import EmptyState from "~/components/common/EmptyState.vue";
import { CustomDropDownList } from "#components";
import CustomDate from "~/components/common/CustomDate.vue";

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
  topicId?: string;
  topicLoading?: boolean;
  duration?: string;
  time?: string;
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

const authAccessTokenCookie = useCookie("signInAccessToken");
const authUserTokenCookie = useCookie("signInUserToken");
const accessToken = authAccessTokenCookie.value;
const currentUser = computed(() => authUserTokenCookie.value as Record<string, any> | null);
const isTeacherAdmin = computed(() => currentUser.value?.roles?.includes("TeacherAdmin"));

const liveCards = ref<SessionCard[]>([]);
const recordedCards = ref<SessionCard[]>([]);
const isLoadingCards = ref(false);

/**
 * ✅ Session-expired modal (shows on any 401 from requests on this page)
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
  authAccessTokenCookie.value = null;
  authUserTokenCookie.value = null;

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
const somakwanzaLoading = ref(true);
const somakwanzaError = ref(false);

const defaultRecordingThumbnail = "https://media.istockphoto.com/id/2217581452/photo/podcast-broadcasting-studio-equipment.webp?a=1&b=1&s=612x612&w=0&k=20&c=BUm5U7iKNGKKXBjc3nqh-YKOVEwGOhE5mWV3x7_xaCY="
const defaultThumbnail =
  "https://media.istockphoto.com/id/1425207399/photo/book-sign-3d-render-concept-for-study-earn-knowledge-reading-and.webp?a=1&b=1&s=612x612&w=0&k=20&c=c94CC40l2cSPQARpJLbGK8J8u9EfEYUQzVe41xr0G6A=";

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
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
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
  viewAllCards.value = viewAllCards.value.map((card) =>
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
  if (!safeTitle) safeTitle = "Live Session";

  return {
    id: session?._id,
    title: safeTitle,
    instructor,
    thumbnail: session?.thumbnail || defaultThumbnail,
    category: schoolLabel || "General",
    subject: subjectLabel || "General",
    topicId,
    topicLoading,
    duration: deriveDuration(start, end),
    description: session?.details || session?.description || "Interactive live lesson",
    time: formatSessionTime(start),
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
    const sorted = [...items].sort((a, b) => {
      const aTime = new Date(a?.createdAt || a?.updatedAt || a?.start_time || 0).getTime();
      const bTime = new Date(b?.createdAt || b?.updatedAt || b?.start_time || 0).getTime();
      return bTime - aTime;
    });
    liveCards.value = sorted.slice(0, 6).map(mapLiveSessionToCard);
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
    const sorted = [...items].sort((a, b) => {
      const aTime = new Date(a?.createdAt || a?.updatedAt || a?.video?.createdAt || a?.video?.updatedAt || 0).getTime();
      const bTime = new Date(b?.createdAt || b?.updatedAt || b?.video?.createdAt || b?.video?.updatedAt || 0).getTime();
      return bTime - aTime;
    });
    recordedCards.value = sorted.slice(0, 6).map(mapRecordedSessionToCard);
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
    somakwanzaLoading.value = true;
    somakwanzaError.value = false;
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
    somakwanzaError.value = true;
  } finally {
    if (!somakwanzaStreamUrl.value) {
      somakwanzaLoading.value = false;
    }
  }
};

/* Create live class (TeacherAdmin only) */
const createDialogOpen = ref(false);
const createSubmitting = ref(false);
const createError = ref("");
const createSuccess = ref("");

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
  if (!accessToken) return;
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
  createDialogOpen.value = true;
  if (process.client) document.documentElement.style.overflow = "hidden";
};

const closeCreateDialog = () => {
  createDialogOpen.value = false;
  if (!viewAllDialog.value && !sessionModalOpen.value && !sessionExpiredModalOpen.value && process.client) {
    document.documentElement.style.overflow = "";
  }
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

    createSuccess.value = "Live class created successfully.";
    await fetchLiveCards();
    closeCreateDialog();
  } catch (error: any) {
    console.error("Failed to create live class:", error);
    createError.value =
      error?.data?.message ||
      error?.response?._data?.message ||
      error?.message ||
      "Failed to create live class. Please try again.";
  } finally {
    createSubmitting.value = false;
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
  if (activeTab.value === "live-classes") return liveFilteredCards.value;
  if (activeTab.value === "recorded-sessions") return recordedCards.value;
  return [];
});

type LiveFilterKey = "all" | "today" | "tomorrow" | "week" | "active" | "past";
const liveFilterGroups: Array<Array<{ key: LiveFilterKey; label: string }>> = [
  [
    { key: "active", label: "Active" },
    { key: "past", label: "Past Sessions" },
  ],
  [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "week", label: "This week" },
  ],
];
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
    return { label: "Live", isLive: true };
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

  if (activeLiveFilter.value === "all") return filtered.slice(0, 6);
  return filtered;
});

const liveMoreCount = computed(() => {
  if (activeLiveFilter.value !== "all") return 0;
  return Math.max(0, liveSortedCards.value.length - 6);
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

const currentEmptyStateMessage = computed(() => {
  if (activeTab.value !== "live-classes") return emptyStateMessages[activeTab.value];
  switch (activeLiveFilter.value) {
    case "today":
      return {
        title: "No classes today",
        description: "There are no live classes scheduled for today.",
      };
    case "tomorrow":
      return {
        title: "No classes tomorrow",
        description: "There are no live classes scheduled for tomorrow.",
      };
    case "week":
      return {
        title: "No classes this week",
        description: "There are no live classes scheduled for this week.",
      };
    case "active":
      return {
        title: "No active classes",
        description: "There are no live classes happening right now.",
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
  () => !isLoadingCards.value && activeTab.value !== "live-tv" && activeCards.value.length === 0
);
const viewAllEmptyStateMessage = computed(
  () => emptyStateMessages[viewAllSection.value] ?? emptyStateMessages["live-classes"]
);
const showViewAllEmptyState = computed(
  () =>
    !isLoadingCards.value &&
    !viewAllLoadingMore.value &&
    filteredViewAllCards.value.length === 0
);

/* View All Dialog */
const viewAllDialog = ref(false);
const viewAllSection = ref<TabKey>("live-classes");
const viewAllSearch = ref("");
const viewAllCards = ref<SessionCard[]>([]);
const viewAllPage = ref(1);
const viewAllHasMore = ref(true);
const viewAllLoadingMore = ref(false);
const viewAllSearchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const viewAllObserver = ref<IntersectionObserver | null>(null);
const viewAllSentinel = ref<HTMLElement | null>(null);
const viewAllPageSize = 6;

const filteredViewAllCards = computed(() => {
  const query = viewAllSearch.value.trim().toLowerCase();
  if (!query) return viewAllCards.value;
  return viewAllCards.value.filter((card) => {
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
    return haystack.includes(query);
  });
});

const resetViewAllState = () => {
  viewAllCards.value = [];
  viewAllPage.value = 1;
  viewAllHasMore.value = true;
};

const buildViewAllQuery = () => {
  const query: Record<string, any> = {
    limit: viewAllPageSize,
    page: viewAllPage.value,
  };
  if (viewAllSearch.value.trim()) query.q = viewAllSearch.value.trim();
  if (viewAllSection.value === "recorded-sessions") {
    query.isRecorded = true;
  }
  return query;
};

const fetchViewAllPage = async () => {
  if (viewAllLoadingMore.value || !viewAllHasMore.value) return;
  viewAllLoadingMore.value = true;
  try {
    const headers = getHeaders();
    const endpoint =
      viewAllSection.value === "live-classes"
        ? apiDocs.liveClassrooms.sessions
        : apiDocs.liveClassrooms.recordedSessions;
    const response: any = await $fetch(endpoint, {
      headers,
      query: buildViewAllQuery(),
    });
    const items = normalizeList(response);
    const mapped =
      viewAllSection.value === "live-classes"
        ? items.map(mapLiveSessionToCard)
        : items.map(mapRecordedSessionToCard);
    viewAllCards.value = [...viewAllCards.value, ...mapped];
    if (items.length < viewAllPageSize) {
      viewAllHasMore.value = false;
    } else {
      viewAllPage.value += 1;
    }
  } catch (error) {
    console.error("Failed to load view all cards:", error);
  } finally {
    viewAllLoadingMore.value = false;
  }
};

const openViewAll = (section: TabKey) => {
  viewAllSection.value = section;
  viewAllDialog.value = true;
  resetViewAllState();
  fetchViewAllPage();
  if (process.client) document.documentElement.style.overflow = "hidden";
};

const closeViewAll = () => {
  viewAllDialog.value = false;
  if (viewAllObserver.value) viewAllObserver.value.disconnect();
  if (!sessionModalOpen.value && !sessionExpiredModalOpen.value && process.client) {
    document.documentElement.style.overflow = "";
  }
};

const setupViewAllObserver = () => {
  if (!process.client) return;
  if (viewAllObserver.value) {
    viewAllObserver.value.disconnect();
  }
  viewAllObserver.value = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        fetchViewAllPage();
      }
    },
    { rootMargin: "200px" }
  );
  if (viewAllSentinel.value) {
    viewAllObserver.value.observe(viewAllSentinel.value);
  }
};

watch(
  () => viewAllDialog.value,
  (isOpen) => {
    if (!isOpen) return;
    nextTick(() => setupViewAllObserver());
  }
);

watch(
  () => viewAllSection.value,
  () => {
    if (!viewAllDialog.value) return;
    resetViewAllState();
    fetchViewAllPage();
  }
);

watch(
  () => viewAllSearch.value,
  () => {
    if (viewAllSearchTimeout.value) {
      clearTimeout(viewAllSearchTimeout.value);
    }
    viewAllSearchTimeout.value = setTimeout(() => {
      if (!viewAllDialog.value) return;
      resetViewAllState();
      fetchViewAllPage();
    }, 300);
  }
);

/* Session Player Modal */
const sessionModalOpen = ref(false);
const selectedSession = ref<SessionCard | null>(null);
const joinRequested = ref(false);
const meetingLoading = ref(false);
const meetingReady = ref(false);
const meetingCheckLoading = ref(false);
const meetingPlayable = ref(false);
const meetingTimedOut = ref(false);
const meetingTimeoutMs = 10000;
const meetingTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null);

const openSessionModal = (card: SessionCard) => {
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

const canJoinSession = computed(() => {
  if (!selectedSession.value) return false;
  if (selectedSession.value.recordingUrl) return true;
  if (meetingEmbedUrl.value) return true;
  return false;
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

  meetingPlayable.value = isMeetingDisplayable.value;
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
};

/**
 * ✅ Meeting embed
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
  fetchCreateOptions();
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  if (viewAllObserver.value) viewAllObserver.value.disconnect();
  if (viewAllSearchTimeout.value) clearTimeout(viewAllSearchTimeout.value);
});

const getItemPath = (value: TabKey) => `/smart-class/screen/${value}`;

const prepareNavigation = () => {
  navigationStore.setGoBack(route.fullPath);
};
</script>

<template>
  <NuxtLayout
    :name="$router.currentRoute.value.fullPath.includes('header-less') ? ('normal' as any) : ('home-layout' as any)">
    <main ref="pageRoot" id="main-container" tabindex="-1" class="min-h-screen bg-white font-sans text-gray-900">
      <div class="container mx-auto max-w-7xl px-4 py-10">
        <!-- Back -->
        <NuxtLink v-if="canGoBack" to="/"
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-gray-50">
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
            <button v-for="tab in tabItems" :key="tab.value" role="tab" type="button"
              :aria-selected="activeTab === tab.value" :class="[
                activeTab === tab.value ? 'bg-primary text-white' : 'text-primary hover:bg-gray-100',
                'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition',
              ]" @click="activeTab = tab.value">
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

              <div v-if="activeTab !== 'live-tv'" class="flex items-center gap-2">
                <button v-if="activeTab === 'live-classes' && isTeacherAdmin" type="button"
                  class="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  @click="openCreateDialog">
                  Create class
                </button>
                <button type="button"
                  class="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  @click="openViewAll(activeTab)">
                  View all
                </button>
              </div>
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
              <div class="relative overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-md">
                <div class="flex items-center justify-between bg-gray-100 px-4 py-2">
                  <span class="text-sm font-semibold">SomaKwanza TV</span>
                  <span class="text-xs font-medium text-primary flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                <video v-if="activeTabPanel.streamUrl && !somakwanzaError" :src="activeTabPanel.streamUrl"
                  class="h-[420px] w-full" loading="lazy" autoplay playsinline @loadeddata="somakwanzaLoading = false"
                  @canplay="somakwanzaLoading = false" @error="somakwanzaLoading = false; somakwanzaError = true"></video>

                <div v-if="activeTabPanel.streamUrl && somakwanzaLoading && !somakwanzaError"
                  class="absolute inset-0 z-10 flex items-center justify-center bg-black/40" role="status"
                  aria-live="polite">
                  <div class="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white"></div>
                </div>

                <div v-if="!activeTabPanel.streamUrl || somakwanzaError" class="grid h-[420px] place-items-center text-gray-400">
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
              <div v-if="activeTab === 'live-classes'" class="mb-4 flex flex-wrap items-center gap-3" role="group" aria-label="Live class filters">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="filter in liveFilterGroups[0]"
                    :key="filter.key"
                    type="button"
                    class="rounded-full px-4 py-2 text-sm font-semibold transition"
                    :class="activeLiveFilter === filter.key ? 'bg-primary text-white' : 'border border-primary text-primary hover:bg-primary/10'"
                    :aria-pressed="activeLiveFilter === filter.key"
                    @click="activeLiveFilter = filter.key"
                  >
                    {{ filter.label }}
                  </button>
                </div>

                <span class="hidden h-8 w-1 bg-primary/30 md:inline-block rounded-full md:mx-3" aria-hidden="true"></span>

                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="filter in liveFilterGroups[1]"
                    :key="filter.key"
                    type="button"
                    class="rounded-full px-4 py-2 text-sm font-semibold transition"
                    :class="activeLiveFilter === filter.key ? 'bg-primary text-white' : 'border border-primary text-primary hover:bg-primary/10'"
                    :aria-pressed="activeLiveFilter === filter.key"
                    @click="activeLiveFilter = filter.key"
                  >
                    {{ filter.label }}
                  </button>
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
                    <img v-if="card.thumbnail" :src="card.thumbnail" class="h-full w-full object-cover" />

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

                    <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{{ card.subject ?? card.category }}</span>
                      <span v-if="activeTab === 'live-classes'" class="inline-flex items-center gap-1">
                        <span v-if="getTimeLeftLabel(card).isLive" class="inline-flex items-center gap-1 text-red-500">
                          <span class="h-2 w-2 rounded-full bg-red-500"></span>
                          Live
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
              <div
                v-if="activeTab === 'live-classes' && activeLiveFilter === 'all' && liveMoreCount > 0"
                class="mt-4 text-center text-sm font-semibold text-gray-500"
              >
                +{{ liveMoreCount }} more
              </div>
            </div>
          </div>
        </section>

        <!-- View All Modal -->
        <div v-if="viewAllDialog" class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-10"
          role="dialog" aria-modal="true" :aria-labelledby="'view-all-title'" @click.self="closeViewAll">
          <div class="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <h2 id="view-all-title" class="text-lg font-semibold text-primary">
                {{ viewAllSection === "live-classes" ? "All Live Classes" : "All Recorded Sessions" }}
              </h2>

              <button type="button"
                class="rounded-full border border-red-500 px-3 py-1.5 text-base font-semibold text-red-500 hover:bg-red-500 hover:text-white hover:border-white transition duration-500 ease-in-out"
                @click="closeViewAll">
                x
              </button>
            </header>

            <div class="p-6" role="region" aria-live="polite" :aria-busy="viewAllLoadingMore">
              <div class="mb-4">
                <label class="sr-only" for="view-all-search">Search sessions</label>
                <input id="view-all-search" v-model="viewAllSearch" type="search" placeholder="Search sessions..."
                  class="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              <div v-if="showViewAllEmptyState" class="space-y-3" role="status" aria-live="polite">
                <EmptyState :title="viewAllEmptyStateMessage?.title"
                  :description="viewAllEmptyStateMessage?.description" />
              </div>

              <div v-else class="grid gap-4 md:grid-cols-2" role="list">
                <article v-for="card in filteredViewAllCards" :key="card.id ?? card.title"
                  class="group flex gap-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden"
                  role="listitem" tabindex="0" @keydown.enter.prevent="openSessionModal(card)"
                  @keydown.space.prevent="openSessionModal(card)">
                  <div class="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-l-lg bg-slate-200">
                    <div v-if="card.thumbnail" class="h-full w-full bg-cover bg-center"
                      :style="{ backgroundImage: `url(${card.thumbnail})` }"></div>

                    <div v-else class="flex h-full w-full items-center justify-center"
                      :style="{ backgroundImage: card.subjectGradient }">
                      <span class="pattern-icon">{{ card.subjectInitials }}</span>
                    </div>

                    <!-- Play overlay (View all) -->
                    <button type="button"
                      class="absolute inset-0 z-10 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
                      aria-label="Play session" @click.stop="openSessionModal(card)">
                      <span
                        class="grid place-items-center rounded-full bg-white/90 p-2 shadow-lg transition group-hover:scale-110">
                        <Icon name="mdi:play-circle" size="34" class="text-primary" />
                      </span>
                    </button>
                  </div>

                  <div class="p-3 min-w-0">
                    <div v-if="card.topicLoading" class="space-y-2" aria-hidden="true">
                      <div class="h-4 w-3/4 rounded bg-slate-200 animate-pulse"></div>
                      <div class="h-3 w-1/2 rounded bg-slate-200 animate-pulse"></div>
                    </div>
                    <h3 v-else class="text-md font-semibold text-slate-900 truncate">{{ card.title }}</h3>
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

              <div v-if="viewAllLoadingMore" class="mt-4 grid gap-4 md:grid-cols-2" role="status" aria-live="polite">
                <div v-for="n in viewAllPageSize" :key="`view-all-skeleton-${n}`"
                  class="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div class="h-20 w-full rounded-lg bg-slate-200"></div>
                  <div class="mt-3 h-4 w-3/4 rounded bg-slate-200"></div>
                  <div class="mt-2 h-3 w-1/2 rounded bg-slate-200"></div>
                </div>
              </div>

              <div ref="viewAllSentinel" class="h-1"></div>
            </div>
          </div>
        </div>

        <!-- Create Live Class Modal -->
        <div v-if="createDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10"
          role="dialog" aria-modal="true" aria-labelledby="create-class-title" @click.self="closeCreateDialog">
          <div class="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <h2 id="create-class-title" class="text-lg font-semibold text-primary">Create Live Class</h2>
              <button type="button"
                class="rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:text-primary/60"
                @click="closeCreateDialog">
                Close
              </button>
            </header>

            <div class="p-6">
              <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="submitCreateSession"
                aria-live="polite">
                <div class="md:col-span-2">
                  <label class="mb-1 block text-sm font-medium text-gray-700" for="create-school-class">
                    School class
                  </label>
                  <CustomDropDownList id="create-school-class" v-model="createForm.schoolClass"
                    class="w-full rounded-lg p-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    :list="classOptions" placeholder="Select class" :disabled="createOptionsLoading" />
                </div>

                <div class="w-full">
                  <label class="mb-1 block text-sm font-medium text-gray-700" for="create-subject">
                    Subject
                  </label>
                  <CustomDropDownList id="create-subject" v-model="createForm.subject"
                    class="w-full rounded-lg p-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    :list="subjectOptions" placeholder="Select subject" :disabled="createOptionsLoading" />
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700" for="create-topic">
                    Topic
                  </label>
                  <CustomDropDownList id="create-topic" v-model="createForm.topic"
                    class="w-full rounded-lg p-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
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

              <button type="button"
                class="rounded-full border border-red-500 px-3 py-1.5 text-base font-semibold text-red-500 hover:bg-red-500 hover:text-white hover:border-white transition duration-500 ease-in-out"
                @click="closeSessionModal">
                x
              </button>
            </header>

            <div class="p-6">
              <div v-if="!joinRequested" class="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div class="h-20 w-20 rounded-md">
                  <img
                    :src="selectedSession?.badge === 'Recorded' ? defaultRecordingThumbnail : defaultThumbnail"
                    alt=""
                    class="h-full w-full rounded-md"
                  >
                </div>
                <div>
                  <h3 class="text-base font-semibold text-gray-900">
                    {{ selectedSession?.title || "Session summary" }}
                  </h3>
                  <p class="mt-1 text-sm text-gray-600">
                    {{ selectedSession?.instructor || "Instructor" }} • {{ selectedSession?.time || "TBD" }}
                  </p>
                  <p v-if="selectedSession?.description" class="mt-3 text-sm text-gray-700">
                    {{ selectedSession.description }}
                  </p>
                </div>

              </div>

              <div v-if="!joinRequested" class="mt-4 flex items-center gap-3">
                <button type="button"
                  class="w-full rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="!selectedSession || meetingCheckLoading" @click="startMeeting">
                  {{ meetingCheckLoading ? "Checking..." : "Join Session" }}
                </button>
              </div>

              <div v-if="joinRequested" class="mt-5">
                <div v-if="meetingPlayable" class="relative">
                  <div v-if="meetingLoading && !meetingReady"
                    class="flex h-[220px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
                    role="status" aria-live="polite">
                    <div class="flex items-center gap-3 text-sm text-gray-600">
                      <span class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></span>
                      Preparing live class...
                    </div>
                  </div>

                  <iframe v-if="playableUrl" :src="playableUrl"
                    :class="meetingReady ? 'h-[420px] w-full rounded-xl bg-black' : 'h-0 w-0 opacity-0 pointer-events-none'"
                    controls autoplay playsinline @load="handleMeetingReady" />

                  <iframe v-else :src="meetingEmbedUrl"
                    :class="meetingReady ? 'h-[420px] w-full rounded-xl bg-black' : 'h-0 w-0 opacity-0 pointer-events-none'"
                    allow="microphone; camera; autoplay; encrypted-media; picture-in-picture" allowfullscreen
                    loading="lazy" @load="handleMeetingReady" />
                </div>

                <div v-else class="rounded-xl border-dashed border-primary bg-gray-50 p-6 min-h-[200px] flex items-center justify-center">
                  <p class="text-sm text-gray-700 text-center text-gray-400">
                    Live class not available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ Session Expired Modal -->
        <div v-if="sessionExpiredModalOpen"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-10" role="dialog"
          aria-modal="true" aria-label="Session expired" @click.self="sessionExpiredModalOpen = false">
          <div class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-center justify-between border-b px-6 py-4">
              <h2 class="text-lg font-semibold text-primary">Session expired</h2>
              <button type="button"
                class="rounded-full border border-red-500 px-3 py-1.5 text-base font-semibold text-red-500 hover:bg-red-500 hover:text-white hover:border-white transition duration-500 ease-in-out"
                @click="sessionExpiredModalOpen = false; if (!viewAllDialog && !sessionModalOpen && process.client) document.documentElement.style.overflow = ''">
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
                  @click="sessionExpiredModalOpen = false; if (!viewAllDialog && !sessionModalOpen && process.client) document.documentElement.style.overflow = ''">
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
</style>
