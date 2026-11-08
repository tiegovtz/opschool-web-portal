<script setup lang="ts">
import type { LanguageSupport } from "~/types/language.interface";
import {
  getEducationRouteQuery,
  getHubPath,
  normalizeEducationLevel,
  resolveEducationLevelFromRoute,
} from "~/utilities/educationRoute";

const props = withDefaults(defineProps<{
  educationLevel?: string;
  language?: LanguageSupport;
}>(), { language: "english" });

const route = useRoute();
const userToken = useCookie("signInUserToken");
const moreMenuOpen = ref(false);
const moreMenuRoot = ref<HTMLElement | null>(null);
const logoutRequested = useState<boolean>("mobile-logout-requested", () => false);
const rememberedLevel = useHubEducationLevel();
const primaryLanguage = usePrimaryContentLanguage();
const level = computed(() => normalizeEducationLevel(
  props.educationLevel || resolveEducationLevelFromRoute(route, normalizeEducationLevel(rememberedLevel.value)),
));
const hubPath = computed(() => getHubPath(level.value));
const hubQuery = computed(() => getEducationRouteQuery(
  level.value,
  {},
  level.value === "primary" ? primaryLanguage.value : "english",
));
const isKiswahili = computed(() => props.language === "kiswahili");
const showCombinations = computed(() => hubPath.value === "/secondary");
const isContentRoute = computed(() =>
  ["/interactive", "/video", "/audio", "/experiments", "/adt"].some(
    path => route.path === path || route.path.startsWith(`${path}/`),
  ),
);
const items = computed(() => [
  {
    id: "home",
    label: isKiswahili.value ? "Nyumbani" : "Home",
    icon: "mdi:home-outline",
    to: { path: hubPath.value, query: hubQuery.value },
    active: route.path === hubPath.value && (!route.query.section || route.query.section === "subjects"),
  },
  {
    id: "contents",
    label: isKiswahili.value ? "Maudhui" : "Contents",
    icon: "mdi:bookshelf",
    to: { path: hubPath.value, query: { ...hubQuery.value, section: "interactive-content" } },
    active: route.path === hubPath.value && !!route.query.section && route.query.section !== "subjects" || isContentRoute.value,
  },
  {
    id: "smart-class",
    label: isKiswahili.value ? "Darasa Janja" : "Smart Class",
    icon: "mdi:monitor",
    to: "/smart-class",
    active: route.path.startsWith("/smart-class"),
  },
  {
    id: "ai-teacher",
    label: isKiswahili.value ? "Mwalimu AI" : "AI Teacher",
    icon: "mdi:robot-outline",
    to: "/tie-ai-teacher",
    active: route.path.startsWith("/tie-ai-teacher"),
  },
]);

const closeMoreMenu = () => { moreMenuOpen.value = false; };
const onDocumentPointerDown = (event: PointerEvent) => {
  if (event.target instanceof Node && !moreMenuRoot.value?.contains(event.target)) closeMoreMenu();
};
const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeMoreMenu();
};
const requestLogout = () => {
  closeMoreMenu();
  logoutRequested.value = true;
};

watch(() => route.fullPath, closeMoreMenu);
onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
  document.addEventListener("keydown", onDocumentKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
  document.removeEventListener("keydown", onDocumentKeydown);
});
</script>

<template>
  <nav aria-label="Mobile navigation" class="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(18,79,134,0.08)] backdrop-blur md:hidden">
    <div class="mx-auto grid max-w-xl grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="item.to"
        :aria-current="item.active ? 'page' : undefined"
        class="flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-2 text-center text-[11px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue"
        :class="item.active ? 'text-[#0879bd]' : 'text-slate-500 hover:text-deepBlue'"
      >
        <Icon :name="item.icon" size="24" aria-hidden="true" />
        <span class="w-full">{{ item.label }}</span>
      </NuxtLink>
      <div ref="moreMenuRoot" class="relative min-w-0" data-account-menu-root>
        <button
          type="button"
          class="flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-2 text-center text-[11px] font-medium leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue"
          :class="moreMenuOpen || route.path.startsWith('/profile') || route.path === '/pdf' || route.path === '/feedback' ? 'text-[#0879bd]' : 'text-slate-500 hover:text-deepBlue'"
          :aria-expanded="moreMenuOpen"
          aria-controls="mobile-more-menu"
          aria-haspopup="menu"
          @click="moreMenuOpen = !moreMenuOpen"
        >
          <Icon name="mdi:dots-horizontal-circle-outline" size="24" aria-hidden="true" />
          <span>{{ isKiswahili ? 'Zaidi' : 'More' }}</span>
        </button>
        <div v-if="moreMenuOpen" id="mobile-more-menu" class="absolute bottom-[calc(100%+8px)] right-0 z-50 max-h-[calc(100dvh-6rem)] w-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl" role="menu" :aria-label="isKiswahili ? 'Zaidi' : 'More'">
          <div class="border-b border-slate-100 pb-1">
            <NuxtLink v-if="showCombinations" :to="{ path: '/pdf', query: hubQuery }" role="menuitem" class="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="closeMoreMenu">
              <Icon name="mdi:book-open-page-variant-outline" size="20" aria-hidden="true" />
              <span>{{ isKiswahili ? 'Muhtasari wa Mafunzo' : 'Combinations of Subjects' }}</span>
            </NuxtLink>
            <NuxtLink :to="{ path: '/feedback', query: hubQuery }" role="menuitem" class="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="closeMoreMenu">
              <Icon name="mdi:message-text-outline" size="20" aria-hidden="true" />
              <span>{{ isKiswahili ? 'Maoni na Msaada' : 'Feedback and Support' }}</span>
            </NuxtLink>
          </div>
          <template v-if="userToken">
            <NuxtLink :to="{ path: '/profile/learning-statistics', query: hubQuery }" role="menuitem" class="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="closeMoreMenu">
              <Icon name="heroicons:chart-bar-square-20-solid" size="20" aria-hidden="true" />
              <span>{{ isKiswahili ? 'Takwimu za ujifunzaji' : 'Learning statistics' }}</span>
            </NuxtLink>
            <NuxtLink :to="{ path: '/profile', query: hubQuery }" role="menuitem" class="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="closeMoreMenu">
              <Icon name="mdi:account-circle-outline" size="20" aria-hidden="true" />
              <span>{{ isKiswahili ? 'Wasifu' : 'Profile' }}</span>
            </NuxtLink>
            <button type="button" role="menuitem" class="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50" @click="requestLogout">
              <Icon name="mdi:logout" size="20" aria-hidden="true" />
              <span>{{ isKiswahili ? 'Ondoka' : 'Log out' }}</span>
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/auth" role="menuitem" class="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="closeMoreMenu">
              <Icon name="mdi:login" size="20" aria-hidden="true" />
              <span>{{ isKiswahili ? 'Ingia' : 'Sign in' }}</span>
            </NuxtLink>
            <NuxtLink to="/auth/SignUp" role="menuitem" class="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="closeMoreMenu">
              <Icon name="mdi:account-plus-outline" size="20" aria-hidden="true" />
              <span>{{ isKiswahili ? 'Jisajili' : 'Create account' }}</span>
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>
