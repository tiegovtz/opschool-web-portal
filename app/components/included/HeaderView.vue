<script setup lang="ts">
import apiDocs from "~/utilities/apiDocs";
import { layoutEffect } from "~/utilities/controlls";
import messages from "~/utilities/messages";
import ConfirmationModal from "~/components/ai-teacher/ConfirmationModal.vue";
import { useNavigationStore } from "~/stores/navigationStore";
import type { LanguageSupport } from "~/types/language.interface";
import { getHubPath, normalizeEducationLevel } from "~/utilities/educationRoute";

const props = withDefaults(
  defineProps<{educationLevel?:string,language?:LanguageSupport}>(),{
    language:'english',
})

const userToken = useCookie<any>("signInUserToken");
const accessToken = useCookie("signInAccessToken");
const refreshToken = useCookie("signInRefreshToken");
const route = useRoute();
const navigationStore = useNavigationStore();

const matchesPath = (path: string) =>
  route.path === path || route.path.startsWith(`${path}/`);

const isHomeRoute = computed(() =>
  route.path === "/" ||
  matchesPath("/home") ||
  matchesPath("/nyumbani") ||
  matchesPath("/secondary") ||
  matchesPath("/primary")
);
const isSmartClassRoute = computed(() => matchesPath("/smart-class"));
const isLearningStatisticsRoute = computed(() =>
  matchesPath("/profile/learning-statistics")
);
const isAccountRoute = computed(() =>
  route.path === "/profile" ||
  (matchesPath("/profile") && !isLearningStatisticsRoute.value)
);

const desktopNavItemClass =
  "flex items-center gap-2 rounded-[6px] px-3 py-1 text-center text-white text-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-oceanBlue";
const mobileNavItemClass =
  "flex items-center justify-center gap-2 rounded-[6px] px-3 py-1 text-center text-white text-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-oceanBlue";
const activeNavItemClass = "bg-deepBlue text-white shadow-sm";
const inactiveNavItemClass = "hover:bg-deepBlue/85 hover:shadow-sm";

const PROTECTED_RETURN_PREFIXES = [
  "/interactive/",
  "/video/",
  "/audio/",
  "/experiments/",
  "/tie-ai-teacher",
];

const shouldRememberCurrentRoute = () =>
  PROTECTED_RETURN_PREFIXES.some(
    (prefix) => route.path === prefix || route.path.startsWith(prefix)
  );

const showLogoutConfirm = ref(false);
const showLogoutToast = ref(false);
const logoutToastTimeout = ref<null|any>(null);
const logoutAlert = ref<HTMLElement|null>(null);
const isAccountMenuOpen = ref(false);

const logout = () => {
  if (shouldRememberCurrentRoute()) {
    navigationStore.setGoBack(route.fullPath);
  }

  userToken.value = null;
  accessToken.value = null;
  refreshToken.value = null;

  layoutEffect.value = "grid";
  window.location.assign("/");
  closeAccountMenu();

  // Screen reader announcement
  if (logoutAlert.value) {
    logoutAlert.value.textContent = "";
    setTimeout(() => {
      if (logoutAlert.value) {
        logoutAlert.value.textContent = messages.success.auth.loggedOut;
      }
    }, 50);
  }

  // Show toast feedback
  showLogoutToast.value = true;
  if (logoutToastTimeout.value) clearTimeout(logoutToastTimeout.value);
  logoutToastTimeout.value = setTimeout(() => {
    showLogoutToast.value = false;
    logoutToastTimeout.value = null;
  }, 4000);
};

const onLogoutConfirm = () => {
  showLogoutConfirm.value = false;
  logout();
};

const onLogoutCancel = () => {
  showLogoutConfirm.value = false;
};

const toggleAccountMenu = () => {
  isAccountMenuOpen.value = !isAccountMenuOpen.value;
};

const closeAccountMenu = () => {
  isAccountMenuOpen.value = false;
};

const openLogoutConfirmFromMenu = () => {
  closeAccountMenu();
  showLogoutConfirm.value = true;
};

const currentEducationLevel = computed(() =>
  props.educationLevel
    ? normalizeEducationLevel(props.educationLevel)
    : props.language === "kiswahili"
      ? "primary"
      : "secondary",
);

const homeTarget = computed(() => getHubPath(currentEducationLevel.value));

const authReturnQuery = computed(() => {
  const p = route.path;
  if (
    p === "/primary" ||
    p.startsWith("/primary/") ||
    p === "/nyumbani" ||
    p.startsWith("/nyumbani/") ||
    p === "/secondary" ||
    p.startsWith("/secondary/") ||
    p === "/home" ||
    p.startsWith("/home/")
  ) {
    return { redirect: route.fullPath };
  }
  return {};
});

const authSignInTo = computed(() =>
  Object.keys(authReturnQuery.value).length
    ? { path: "/auth", query: authReturnQuery.value }
    : "/auth",
);

const authSignUpTo = computed(() =>
  Object.keys(authReturnQuery.value).length
    ? { path: "/auth/SignUp", query: authReturnQuery.value }
    : "/auth/SignUp",
);

watch(
  () => route.fullPath,
  () => {
    closeAccountMenu();
  },
);

onBeforeUnmount(() => {
  if (logoutToastTimeout.value) clearTimeout(logoutToastTimeout.value);
});

</script>

<template>
  <!-- Header -->
  <header class="relative shadow-sm bg-[url('/flag/tenor.gif')] bg-cover bg-center bg-no-repeat" role="navigation">
    <nav class="flex flex-col items-center bg-white bg-opacity-75">
      <!-- Header -->
      <included-upper-header class="w-full" :language />
      <div class="w-full ">
        <!-- Media Screen -->
        <div
          class="flex-col items-center hidden w-full gap-2 text-white md:flex md:flex-row bg-oceanBlue rounded-xs wrapper-container">
          <NuxtLink
            aria-label="Go home"
            :to="homeTarget"
            :aria-current="isHomeRoute ? 'page' : undefined"
            :class="[desktopNavItemClass, isHomeRoute ? activeNavItemClass : inactiveNavItemClass]"
          >
            <div class="flex items-center justify-center">
              <IconsHome :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">{{ language==='english' ? `Secondary` :`Primary`}}</p>
          </NuxtLink>

          <!-- TIE Library Books -->
          <a
            aria-label="Visit TIE online library"
            href="https://ol.tie.go.tz/index.php"
            target="_blank"
            rel="noopener noreferrer"
            :class="[desktopNavItemClass, inactiveNavItemClass]"
          >
            <div class="flex items-center justify-center">
              <IconsTieLibrary :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">{{ language==='english' ? `TIE Library` :`Maktaba`}}</p>
          </a>

          <!-- Smart Class Hub -->
          <NuxtLink
            to="/smart-class"
            aria-label="Go to Smart Class"
            :aria-current="isSmartClassRoute ? 'page' : undefined"
            :class="[desktopNavItemClass, isSmartClassRoute ? activeNavItemClass : inactiveNavItemClass]"
          >
            <div class="flex items-center justify-center">
              <IconsSmartClassHub :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">{{ language==='english' ? `Smart class` :`Darasa janja`}}</p>
          </NuxtLink>

          <!-- title (TIE online public school) -->
          <div class="flex-1" role="navigation">
            <NuxtLink aria-label="Go home" to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                {{ language==='english' ? `TIE online school` :`shule mtandao ya TET`}}
              </p>
            </NuxtLink>
          </div>

          <NuxtLink
            v-if="userToken"
            aria-label="Go to learning statistics page"
            to="/profile/learning-statistics"
            :aria-current="isLearningStatisticsRoute ? 'page' : undefined"
            :class="[desktopNavItemClass, isLearningStatisticsRoute ? activeNavItemClass : inactiveNavItemClass]"
          >
            <div class="flex items-center justify-center">
              <Icon name="heroicons:chart-bar-square-20-solid" class="w-5 h-5" />
            </div>
            <p class="hidden capitalize lg:flex">
              {{ language==='english' ? `Learning statistics` :`Takwimu za ujifunzaji`}}
            </p>
          </NuxtLink>

          <div class="subInfo">
            <div class="flex items-center gap-4 p-2" v-if="!userToken">
              <!-- sign in -->
              <NuxtLink aria-label="go to sign in page" :to="authSignInTo" title="Sign in"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <IconsSignIn :size="20" />
                <p class="hidden capitalize lg:flex">
                   {{ language==='english' ? `Sign in` :`Ingia`}}
                  </p>
              </NuxtLink>

              <!-- sign up -->
              <NuxtLink aria-label="Go to sign up page" :to="authSignUpTo" title="Sign Up"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <IconsProfileCircle :size="24" />
                <p class="hidden capitalize lg:flex">
                   {{ language==='english' ? `Create Account` :`Jisajili`}}
                  </p>
              </NuxtLink>
            </div>

            <div v-else class="relative px-2 py-1">
              <button
                aria-label="Open account menu"
                :aria-current="isAccountRoute ? 'page' : undefined"
                :class="[
                  desktopNavItemClass,
                  isAccountRoute || isAccountMenuOpen ? activeNavItemClass : inactiveNavItemClass,
                ]"
                @click="toggleAccountMenu"
              >
                <div
                  v-if="userToken?.profilePic && userToken?.profilePic?.trim() !== ''"
                  class="w-8 h-8 overflow-hidden rounded-full ring-2 ring-white/30"
                >
                  <img
                    :src="apiDocs.baseURL.replace('v1', '') + userToken?.profilePic"
                    alt="User Profile"
                    class="object-cover w-full h-full rounded-full"
                  />
                </div>
                <div
                  v-else
                  class="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 ring-2 ring-white/20"
                >
                  <IconsProfileCircle :size="20" />
                </div>
                <p class="hidden capitalize lg:flex text-medium line-clamp-1 max-w-40">
                  {{ language==='english' ? `Account` :`Akaunti`}}
                </p>
                <Icon
                  name="heroicons:chevron-down-20-solid"
                  class="hidden w-5 h-5 lg:block"
                />
              </button>

              <div
                v-if="isAccountMenuOpen"
                class="absolute right-0 z-30 w-56 mt-2 overflow-hidden bg-white border shadow-xl top-full rounded-2xl border-slate-200"
              >
                <NuxtLink
                  aria-label="Go to profile page"
                  to="/profile"
                  class="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
                  @click="closeAccountMenu"
                >
                  <IconsProfileCircle :size="20" />
                  <span>{{ language==='english' ? `Profile` :`Wasifu`}}</span>
                </NuxtLink>

                <button
                  aria-label="Log out"
                  class="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left transition-colors text-rose-700 hover:bg-rose-50"
                  @click="openLogoutConfirmFromMenu"
                >
                  <IconsLogout :size="20" title="Sign out" />
                  <span>{{ language==='english' ? `Logout` :`Ondoka`}}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div class="flex flex-col items-center w-full text-white md:hidden md:flex-row bg-oceanBlue rounded-b-md">
          <!-- Profile and Sign Up and Home -->
          <div class="flex items-center justify-between w-full">
            <div class="flex">
              <NuxtLink
                aria-label="Go home"
                :to="homeTarget"
                :aria-current="isHomeRoute ? 'page' : undefined"
                :class="[mobileNavItemClass, isHomeRoute ? activeNavItemClass : inactiveNavItemClass]"
              >
                <div class="flex items-center justify-center">
                  <IconsHome :size="20" />
                </div>
                <p class="hidden capitalize lg:flex">
                  {{ language==='english' ? `Secondary` :`Primary`}}
                </p>
              </NuxtLink>

              <!-- TIE Library Books -->
              <a
                aria-label="Visit TIE online library"
                href="https://ol.tie.go.tz/index.php"
                target="_blank"
                rel="noopener noreferrer"
                :class="[mobileNavItemClass, inactiveNavItemClass]"
              >
                <div class="flex items-center justify-center">
                  <IconsTieLibrary :size="20" />
                </div>
              </a>
              <NuxtLink
                to="/smart-class"
                aria-label="Go to Smart Class"
                :aria-current="isSmartClassRoute ? 'page' : undefined"
                :class="[mobileNavItemClass, isSmartClassRoute ? activeNavItemClass : inactiveNavItemClass]"
              >
                <div class="flex items-center justify-center">
                  <IconsSmartClassHub :size="20" />
                </div>
              </NuxtLink>

              <NuxtLink
                v-if="userToken"
                to="/profile/learning-statistics"
                aria-label="Go to learning statistics page"
                :aria-current="isLearningStatisticsRoute ? 'page' : undefined"
                :class="[mobileNavItemClass, isLearningStatisticsRoute ? activeNavItemClass : inactiveNavItemClass]"
              >
                <div class="flex items-center justify-center">
                  <Icon name="heroicons:chart-bar-square-20-solid" class="w-5 h-5" />
                </div>
              </NuxtLink>
            </div>

            <!-- Paragraph Text -->
            <NuxtLink to="/">
              <p class="block text-center uppercase lg:text-large text-[14px] text-shadow">
                 {{ language==='english' ? `TIE online school` :`shule mtandao ya TIE`}}
              </p>
            </NuxtLink>

            <!-- Account and Sign in -->
            <div class="relative flex items-center">
              <div v-if="userToken">
                <button
                  aria-label="Open account menu"
                  :aria-current="isAccountRoute ? 'page' : undefined"
                  :class="[
                    mobileNavItemClass,
                    isAccountRoute || isAccountMenuOpen ? activeNavItemClass : inactiveNavItemClass,
                  ]"
                  @click="toggleAccountMenu"
                >
                  <div
                    v-if="userToken?.profilePic && userToken?.profilePic?.trim() !== ''"
                    class="w-8 h-8 overflow-hidden rounded-full ring-2 ring-white/30"
                  >
                    <img
                      :src="apiDocs.baseURL.replace('v1', '') + userToken?.profilePic"
                      alt="User Profile"
                      class="object-cover w-full h-full rounded-full"
                    />
                  </div>
                  <IconsProfileCircle v-else :size="22" />
                </button>

                <div
                  v-if="isAccountMenuOpen"
                  class="absolute right-0 z-30 w-48 overflow-hidden bg-white border shadow-xl top-full rounded-2xl border-slate-200"
                >
                  <NuxtLink
                    aria-label="Go to profile page"
                    to="/profile"
                    class="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
                    @click="closeAccountMenu"
                  >
                    <IconsProfileCircle :size="20" />
                    <span>{{ language==='english' ? `Profile` :`Wasifu`}}</span>
                  </NuxtLink>

                  <button
                    aria-label="Log out"
                    class="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left transition-colors text-rose-700 hover:bg-rose-50"
                    @click="openLogoutConfirmFromMenu"
                  >
                    <IconsLogout :size="20" title="Sign out" />
                    <span>{{ language==='english' ? `Logout` :`Ondoka`}}</span>
                  </button>
                </div>
              </div>

              <div v-else class="flex items-center">
                <NuxtLink :to="authSignUpTo" title="Sign Up"
                  class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                  <IconsProfileCircle :size="20" />
                </NuxtLink>

                <NuxtLink aria-label="go to sign in page" :to="authSignInTo" title="Sign in"
                  class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                  <IconsSignIn :size="20" class="" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
        <div ref="logoutAlert" aria-live="assertive" aria-atomic="true" class="sr-only"></div>
      </div>
    </nav>

    <!-- Logout confirmation modal -->
    <ConfirmationModal
      :is-open="showLogoutConfirm"
      title="Log out"
      :message="messages.info.auth.logoutConfirm"
      confirm-text="Log out"
      cancel-text="Cancel"
      variant="danger"
      icon="heroicons:arrow-right-on-rectangle"
      @confirm="onLogoutConfirm"
      @cancel="onLogoutCancel"
      @close="showLogoutConfirm = false"
    />

    <!-- Logout success toast -->
    <Transition name="toast">
      <div
        v-if="showLogoutToast"
        role="status"
        aria-live="polite"
        class="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 px-5 py-3 rounded-lg bg-deepBlue text-white text-center shadow-lg max-w-[90vw]"
      >
        {{ messages.success.auth.loggedOut }}
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
