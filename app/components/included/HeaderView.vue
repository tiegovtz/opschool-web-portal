<script setup lang="ts">
import apiDocs from "~/utilities/apiDocs";
import { layoutEffect } from "~/utilities/controlls";
import messages from "~/utilities/messages";
import ConfirmationModal from "~/components/ai-teacher/ConfirmationModal.vue";
import { useNavigationStore } from "~/stores/navigationStore";
import type { LanguageSupport } from "~/types/language.interface";

const props = withDefaults(
  defineProps<{educationLevel?:string,language?:LanguageSupport}>(),{
    language:'english',
})

const userToken = useCookie<any>("signInUserToken");
const accessToken = useCookie("signInAccessToken");
const refreshToken = useCookie("signInRefreshToken");
const route = useRoute();
const navigationStore = useNavigationStore();

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

const logout = () => {
  if (shouldRememberCurrentRoute()) {
    navigationStore.setGoBack(route.fullPath);
  }

  userToken.value = null;
  accessToken.value = null;
  refreshToken.value = null;

  layoutEffect.value = "grid";
  window.location.assign("/");
  dropDown();

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

const openLogoutConfirm = (event:KeyboardEvent|Event) => {
  if (event?.type === "keyup" && !["Enter", " "].includes((event as KeyboardEvent).key)) return;
  showLogoutConfirm.value = true;
};

const onLogoutConfirm = () => {
  showLogoutConfirm.value = false;
  logout();
};

const onLogoutCancel = () => {
  showLogoutConfirm.value = false;
};

const isPop = ref(true);

const dropDown = () => {
  isPop.value = !isPop.value;
};

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
          <NuxtLink aria-label="Go home" to="/home" class="flex gap-2 pl-2 pr-2 rounded-md"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsHome :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">{{ language==='english' ? `Home` :`nyumbani`}}</p>
          </NuxtLink>

          <!-- TIE Library Books -->
          <a aria-label="Visit TIE online library" href="https://ol.tie.go.tz/index.php" target="_blank"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsTieLibrary :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">{{ language==='english' ? `TIE Library` :`Maktaba`}}</p>
          </a>

          <!-- Smart Class Hub -->
          <NuxtLink to="/smart-class" aria-label="Go to Smart Class"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium rounded-md"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsSmartClassHub :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">{{ language==='english' ? `Smart class` :`Darasa janja`}}</p>
          </NuxtLink>

          <!-- title (TIE online public school) -->
          <div class="flex-1" role="navigation">
            <NuxtLink aria-label="Go home" to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                {{ language==='english' ? `TIE online public school` :`shule mtandao ya TET`}}
              </p>
            </NuxtLink>
          </div>

          <!-- Profile and Sign Up -->
          <div class="subInfo">
            <div class="flex items-center gap-4 px-2 py-1" v-if="userToken">

              <!-- Profile -->
              <NuxtLink aria-label="Go to profile page" to="/profile">
                <div class="flex items-center justify-center overflow-hidden">
                  <div class="flex items-center gap-1 cursor-pointer">
                    <div v-if="userToken?.profilePic && userToken?.profilePic?.trim() !== ''" class="w-8 h-8">
                      <img :src="apiDocs.baseURL.replace('v1', '') + userToken?.profilePic" alt="User Profile"
                        class="object-cover w-full h-full rounded-full" />
                    </div>
                    <IconsProfileCircle v-else :size="24" />
                    <p class="capitalize text-medium line-clamp-1 max-w-60">
                       {{ language==='english' ? `Hello,` :`Habari,`}}
                      {{ String(userToken.name).split(" ")[0] }}
                    </p>
                  </div>
                </div>
              </NuxtLink>

              <!-- Logout -->
              <button aria-label="Log out"
                class="flex items-center h-6 gap-2 p-2 text-white border-white rounded-md cursor-pointer border-1 md:h-8"
                @click="openLogoutConfirm" @keyup="openLogoutConfirm">
                <span class="capitalize"> 
                   {{ language==='english' ? `Logout` :`Ondoka`}} 
                </span>
                <IconsLogout :size="20" title="Sign out" />
              </button>
            </div>

            <div class="flex items-center gap-4 p-2" v-else>
              <!-- sign in -->
              <NuxtLink aria-label="go to sign in page" to="/auth" title="Sign in"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <IconsSignIn :size="20" />
                <p class="hidden capitalize lg:flex">
                   {{ language==='english' ? `Sign in` :`Ingia`}}
                  </p>
              </NuxtLink>

              <!-- sign up -->
              <NuxtLink aria-label="Go to sign up page" to="/auth/SignUp" title="Sign Up"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <IconsProfileCircle :size="24" />
                <p class="hidden capitalize lg:flex">
                   {{ language==='english' ? `Create Account` :`Jisajili`}}
                  </p>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div class="flex flex-col items-center w-full text-white md:hidden md:flex-row bg-oceanBlue rounded-b-md">
          <!-- Profile and Sign Up and Home -->
          <div class="flex items-center justify-between w-full">
            <div class="flex">

           
            <NuxtLink aria-label="Go home" to="/home" class="flex gap-2 pr-2 pl-2 rounded-md"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <IconsHome :size="20" />
                </div>
                <p class="hidden capitalize lg:flex">
                  {{ language==='english' ? `Home` :`Nyumbani`}}
                </p>
              </NuxtLink>  
            

              

              <!-- TIE Library Books -->
              <a aria-label="Visit TIE online library" href="https://ol.tie.go.tz/index.php" target="_blank"
                class="flex items-center justify-center gap-2 px-2 text-center text-white cursor-pointer text-medium lg:w-45"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <IconsSubjects :size="20" />
                </div>
              </a>
              <NuxtLink to="/smart-class" aria-label="Go to Smart Class"
                class="flex items-center justify-center gap-2 px-2 text-center text-white cursor-pointer text-medium lg:w-45 rounded-md"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <IconsSmartClassHub :size="20" />
                </div>
              </NuxtLink>
            </div>

            <!-- Paragraph Text -->
            <NuxtLink to="/">
              <p class="block text-center uppercase lg:text-large text-[14px] text-shadow">
                 {{ language==='english' ? `TIE online public school` :`shule mtandao ya TIE`}}
              </p>
            </NuxtLink>

            <!-- Logout and Sign in -->
            <div class="flex items-center">
                    <NuxtLink aria-label="Go to profile page" to="/profile" v-if="userToken" class="flex items-center pl-1">
                <IconsProfileCircle :size="20" />
              </NuxtLink> 
              <NuxtLink to="/auth/SignUp" title="Sign Up" v-else
                class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                <IconsProfileCircle :size="20" />
              </NuxtLink>
              <div class="flex items-center h-6 gap-2 p-2 cursor-pointer md:h-8" v-if="userToken"
                role="button" tabindex="0" aria-label="Log out"
                @click="openLogoutConfirm" @keyup="openLogoutConfirm">
                <IconsLogout :size="20" class="" title="Sign out" />
              </div>
              <!-- sign in -->
              <NuxtLink aria-label="go to sign in page" to="/auth" title="Sign in" v-else
                class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                <IconsSignIn :size="20" class="" />
              </NuxtLink>
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
