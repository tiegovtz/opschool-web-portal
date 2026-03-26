<script setup>
import apiDocs from "~/utilities/apiDocs";
import { layoutEffect } from "~/utilities/controlls";
import messages from "~/utilities/messages";
import ConfirmationModal from "~/components/ai-teacher/ConfirmationModal.vue";
import { useNavigationStore } from "~/stores/navigationStore";
const userToken = useCookie("signInUserToken");
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
const logoutToastTimeout = ref(null);
const logoutAlert = ref(null);

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

const openLogoutConfirm = (event) => {
  if (event?.type === "keyup" && !["Enter", " "].includes(event.key)) return;
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
      <div class="relative flex justify-center w-full h-24 pt-1">
        <div class="flex items-center justify-between w-full h-full wrapper-container">
          <NuxtLink to="/" aria-label="Go to homepage,link with court of arm image "
            aria-describedby="tanzania-emblem-longdesc"
            class="flex items-center justify-center h-full cursor-pointer max-w-[50px]">
            <figure>
              <img src="/logo/emblem.webp"
                alt="Tanzania coat of arms: man and woman supporting a central shield with Mount Kilimanjaro, flag colors, water waves, a torch, and crossed tools"
                role="img" aria-describedby="tanzania-emblem-longdesc" class="object-contain w-full h-full" />

              <figcaption id="tanzania-emblem-longdesc" class="sr-only">
                Tanzania’s coat of arms with a central shield supported by a man on the viewer’s left and a woman on the
                viewer’s
                right. The shield shows Mount Kilimanjaro at the top, Tanzania’s flag colors across the middle, and blue
                and white
                waves at the bottom. A gold torch with a red-orange flame stands in front. Behind the shield are crossed
                traditional
                tools: a spear and a hoe.
              </figcaption>
            </figure>
          </NuxtLink>

          <div class="flex flex-col items-center h-full gap-1 text-center uppercase font-tahomabd" tabindex="0"
            aria-label="Presented by Ministry of education, science and technology together with Tanzania institute of education (TIE)"
            role="region">
            <p class="md:text-small text-[10px] text-deepBlue text-shadow">
              Ministry of education, science and technology
            </p>
            <p class="lg:text-[1.8rem] md:text-[1.4rem] text-[15px]">
              Tanzania institute of education (TIE)
            </p>
          </div>
          <NuxtLink to="/" class="flex items-center justify-center h-full p-2 cursor-pointer">
            <img src="/logo/logo_tie.gif" class="w-16 h-13"
              alt="An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text ‘Taasisi ya Elimu Tanzania.’ At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text ‘Elimu ni Kazi." />
          </NuxtLink>
        </div>
      </div>

      <div class="w-full ">
        <!-- Media Screen -->
        <div
          class="flex-col items-center hidden w-full gap-2 text-white md:flex md:flex-row bg-oceanBlue rounded-xs wrapper-container">
          <NuxtLink aria-label="Go home" to="/home" class="flex gap-2 pl-2 pr-2 rounded-md"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsHome :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">Home</p>
          </NuxtLink>

          <!-- TIE Library Books -->
          <a aria-label="Visit TIE online library" href="https://ol.tie.go.tz/index.php" target="_blank"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsTieLibrary :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">TIE Library</p>
          </a>

          <!-- Smart Class Hub -->
          <NuxtLink to="/smart-class" aria-label="Go to Smart Class"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium rounded-md"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsSmartClassHub :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">Smart Class</p>
          </NuxtLink>

          <!-- title (TIE online public school) -->
          <div class="flex-1" role="navigation">
            <NuxtLink aria-label="Go home" to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                TIE online school
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
                      Hello,
                      {{ String(userToken.name).split(" ")[0] }}
                    </p>
                  </div>
                </div>
              </NuxtLink>

              <!-- Logout -->
              <button aria-label="Log out"
                class="flex items-center h-6 gap-2 p-2 text-white border-white rounded-md cursor-pointer border-1 md:h-8"
                @click="openLogoutConfirm" @keyup="openLogoutConfirm">
                <span class="capitalize"> Logout </span>
                <IconsLogout :size="20" title="Sign out" />
              </button>
            </div>

            <div class="flex items-center gap-4 p-2" v-else>
              <!-- sign in -->
              <NuxtLink aria-label="go to sign in page" to="/auth" title="Sign in"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <IconsSignIn :size="20" />
                <p class="hidden capitalize lg:flex">Sign in</p>
              </NuxtLink>

              <!-- sign up -->
              <NuxtLink aria-label="Go to sign up page" to="/auth/SignUp" title="Sign Up"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <IconsProfileCircle :size="24" />
                <p class="hidden capitalize lg:flex">Create Account</p>
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
                <p class="hidden capitalize lg:flex">Home</p>
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
                TIE online school
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
