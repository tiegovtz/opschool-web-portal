<script setup lang="ts">
import apiDocs from "~/utilities/apiDocs";
import {
  extractSubjectSlugs,
  normalizeSubjectSlug,
} from "~/config/aiLauncherConfig";
import { onBeforeUnmount, onMounted } from "vue";
import type { LocationQueryRaw } from "vue-router";

const route = useRoute();
const router = useRouter();
const contentLayoutLanguage = useContentLayoutLanguage();

const userToken = useCookie("signInUserToken");
const accessToken = useCookie("signInAccessToken");

const tieOverlayOpening = useState<boolean>(
  "tie-ai-overlay-opening",
  () => false,
);
const tieOverlayOpen = useState<boolean>("tie-ai-overlay-open", () => false);
const tieOverlayBackground = useState<string>(
  "tie-ai-overlay-background",
  () => "",
);
const tieOverlayPushed = useState<boolean>(
  "tie-ai-overlay-pushed",
  () => false,
);
const subjectTeacherOpen = useState<boolean>(
  "ai-subject-teacher-is-open",
  () => false,
);
const allowedSubjectSlugs = useState<string[]>(
  "ai-launcher-allowed-subjects",
  () => [],
);
const openSubjectTeacherSignal = useState<number>(
  "ai-subject-teacher-open-signal",
  () => 0,
);
const isLoadingAllowedSubjects = ref(false);

const EXCLUDED_PREFIXES = [
  "/tie-ai-teacher",
  "/auth",
  "/smart-class",
  "/english-practice",
  "/conversation-practice",
];
const EXCLUDED_EXACT: string[] = ["/"];

const isLoggedIn = computed(() => !!(userToken.value || accessToken.value));
const isBusy = computed(
  () =>
    tieOverlayOpening.value || tieOverlayOpen.value || subjectTeacherOpen.value,
);

const isExcluded = computed(() => {
  const path = route.path.toLowerCase();
  if (EXCLUDED_EXACT.includes(path)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
});

const loadAllowedSubjects = async () => {
  if (!isLoggedIn.value) return;
  if (isLoadingAllowedSubjects.value || allowedSubjectSlugs.value.length > 0)
    return;

  isLoadingAllowedSubjects.value = true;
  try {
    const response = await $fetch(apiDocs.subjects.getPublicSubjects);
    allowedSubjectSlugs.value = extractSubjectSlugs(response);
  } catch (error) {
    console.warn("[GlobalLauncher] Failed to load allowed subjects:", error);
  } finally {
    isLoadingAllowedSubjects.value = false;
  }
};

watch(
  isLoggedIn,
  (loggedIn) => {
    if (loggedIn) loadAllowedSubjects();
  },
  { immediate: true },
);

const hasValidSubjectContext = computed(() => {
  const params = route.params as Record<string, unknown>;
  const idCandidates = [params.topicId, params.chapterId];
  const hasValidId = idCandidates.some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  const querySubject =
    typeof route.query.subject === "string" ? route.query.subject : "";
  const subjectSlugRaw = params.subject ?? params.subjectSlug ?? querySubject;
  const subjectSlug = normalizeSubjectSlug(subjectSlugRaw);
  const isInteractiveTopicRoute =
    route.path.toLowerCase().startsWith("/interactive/") &&
    typeof params.topicId === "string" &&
    params.topicId.trim().length > 0 &&
    Boolean(subjectSlug);

  if (isInteractiveTopicRoute) {
    return true;
  }

  const isAllowed =
    allowedSubjectSlugs.value.length === 0
      ? Boolean(subjectSlug)
      : allowedSubjectSlugs.value.includes(subjectSlug);

  return hasValidId && isAllowed;
});

const showLauncher = computed(
  () => isLoggedIn.value && !isExcluded.value && !isBusy.value,
);
const isSwahili = computed(() => contentLayoutLanguage.value === "kiswahili");
const launcherLabel = computed(() =>
  hasValidSubjectContext.value
    ? isSwahili.value
      ? "Mwalimu wa Somo Akili Unde"
      : "AI Subject Teacher"
    : isSwahili.value
      ? "Mwalimu Akili Unde"
      : "AI Teacher",
);
const launcherHoverLabel = computed(() =>
  hasValidSubjectContext.value
    ? isSwahili.value
      ? "Uliza Mwalimu wa Somo wa Akili Unde"
      : "Ask AI Subject Teacher"
    : isSwahili.value
      ? "Uliza Mwalimu Akili Unde"
      : "Ask AI Teacher",
);
const isLauncherHovered = ref(false);
const isSmallScreen = ref(false);

const updateViewportState = () => {
  if (typeof window === "undefined") return;
  isSmallScreen.value = window.innerWidth < 640;
};

const openTieOverlay = async () => {
  if (tieOverlayOpen.value || tieOverlayOpening.value) return;
  tieOverlayOpening.value = true;
  try {
    tieOverlayBackground.value = route.fullPath;
    tieOverlayPushed.value = true;
    const query: LocationQueryRaw = {
      ...route.query,
      overlay: "1",
    };
    const state = {
      aiOverlay: true,
      aiOverlayBackground: route.fullPath,
    };
    await router.push({ query, state });
    tieOverlayOpen.value = true;
  } finally {
    tieOverlayOpening.value = false;
  }
};

const handleClick = async () => {
  if (!showLauncher.value) return;
  if (hasValidSubjectContext.value) {
    openSubjectTeacherSignal.value += 1;
    return;
  }
  await openTieOverlay();
};

onMounted(() => {
  updateViewportState();
  if (typeof window === "undefined") return;
  window.addEventListener("resize", updateViewportState);
  window.addEventListener("orientationchange", updateViewportState);
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") return;
  window.removeEventListener("resize", updateViewportState);
  window.removeEventListener("orientationchange", updateViewportState);
});
</script>

<template>
  <Teleport to="body">
    <client-only>
      <div
        v-if="showLauncher"
        class="fixed z-[80]"
        :class="
          isSmallScreen
            ? 'right-3 bottom-[calc(12px+env(safe-area-inset-bottom))]'
            : 'right-4 bottom-[calc(16px+env(safe-area-inset-bottom))]'
        "
      >
        <div
          class="absolute inset-0 rounded-full bg-[rgba(245,245,245,0.35)] backdrop-blur-sm pointer-events-none"
        ></div>
        <button
          type="button"
          class="relative flex items-center justify-center gap-2 rounded-full bg-oceanBlue text-white border border-white/80 ring-2 ring-white/90 shadow-2xl transition hover:bg-deepBlue focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-oceanBlue whitespace-nowrap"
          :class="isSmallScreen ? 'px-3 py-3' : 'p-4'"
          :aria-label="launcherLabel"
          :disabled="isBusy"
          @mouseenter="isLauncherHovered = true"
          @mouseleave="isLauncherHovered = false"
          @click="handleClick"
        >
          <IconsRobotAi :size="isSmallScreen ? 22 : 24" />
          <span class="hidden md:block">{{ launcherLabel }}</span>
        </button>
        <div
          v-if="isLauncherHovered"
          class="absolute right-0 bottom-[calc(100%+10px)] rounded-md bg-black/80 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap pointer-events-none"
          role="tooltip"
        >
          {{ launcherHoverLabel }}
        </div>
      </div>
    </client-only>
  </Teleport>
</template>
