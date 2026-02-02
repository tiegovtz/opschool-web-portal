<script setup lang="ts">
import { isAllowedSubjectSlug, normalizeSubjectSlug } from "~/config/aiLauncherConfig";

const route = useRoute();
const router = useRouter();

const userToken = useCookie("signInUserToken");
const accessToken = useCookie("signInAccessToken");

const tieOverlayOpening = useState<boolean>("tie-ai-overlay-opening", () => false);
const tieOverlayOpen = useState<boolean>("tie-ai-overlay-open", () => false);
const tieOverlayBackground = useState<string>("tie-ai-overlay-background", () => "");
const tieOverlayPushed = useState<boolean>("tie-ai-overlay-pushed", () => false);
const subjectTeacherOpen = useState<boolean>("ai-subject-teacher-is-open", () => false);
const openSubjectTeacherSignal = useState<number>(
  "ai-subject-teacher-open-signal",
  () => 0
);

const EXCLUDED_PREFIXES = [
  "/tie-ai-teacher",
  "/auth",
  "/admin",
  "/smart-class",
];
const EXCLUDED_EXACT = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const isLoggedIn = computed(() => !!(userToken.value || accessToken.value));
const isBusy = computed(
  () => tieOverlayOpening.value || tieOverlayOpen.value || subjectTeacherOpen.value
);

const isExcluded = computed(() => {
  const path = route.path.toLowerCase();
  if (EXCLUDED_EXACT.includes(path)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
});

const hasValidSubjectContext = computed(() => {
  const params = route.params as Record<string, unknown>;
  const idCandidates = [
    params.topicId,
    params.chapterId,
    params.subjectId,
    params.videoId,
    params.audioId,
    params.experimentId,
    params.id,
  ];
  const hasValidId = idCandidates.some(
    (value) => typeof value === "string" && value.trim().length > 0
  );

  const querySubject =
    typeof route.query.subject === "string" ? route.query.subject : "";
  const subjectSlugRaw = params.level ?? params.subject ?? params.subjectSlug ?? querySubject;
  const subjectSlug = normalizeSubjectSlug(subjectSlugRaw);
  return hasValidId && isAllowedSubjectSlug(subjectSlug);
});

const showLauncher = computed(
  () => isLoggedIn.value && !isExcluded.value && !isBusy.value
);

const openTieOverlay = async () => {
  if (tieOverlayOpen.value || tieOverlayOpening.value) return;
  tieOverlayOpening.value = true;
  try {
    tieOverlayBackground.value = route.fullPath;
    tieOverlayPushed.value = true;
    const query = {
      ...route.query,
      overlay: "1",
    } as Record<string, unknown>;
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
</script>

<template>
  <Teleport to="body">
    <button
      v-if="showLauncher"
      type="button"
      class="fixed z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-oceanBlue text-white shadow-lg transition hover:bg-deepBlue focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-oceanBlue right-4 bottom-[calc(16px+env(safe-area-inset-bottom))]"
      aria-label="Open AI assistant"
      :disabled="isBusy"
      @click="handleClick"
    >
      <Icon name="mdi:robot" size="24" />
    </button>
  </Teleport>
</template>
