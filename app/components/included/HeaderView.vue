<script setup>
import apiDocs from "~/utilities/api-docs";
import { layoutEffect } from "~/utilities/controlls";

const userToken = useCookie("signInUserToken");
const accessToken = useCookie("signInAccessToken");
const refreshToken = useCookie("signInRefreshToken");

const logout = () => {
  // Clear All Cookies
  userToken.value = null;
  accessToken.value = null;
  refreshToken.value = null;

  const router = useRouter();
  layoutEffect.value = "grid";
  router.replace("/home");
  // Dismiss Drop Down
  dropDown();
};

const isPop = ref(true);

const dropDown = () => {
  isPop.value = !isPop.value;
};
</script>

<template>
  <!-- Header -->
  <header class="relative shadow-sm bg-[url('/flag/tenor.gif')] bg-cover bg-center bg-no-repeat" role="navigation">
    <nav class="flex flex-col items-center bg-white bg-opacity-75">
      <!-- Header -->
      <div class="relative flex justify-center w-full h-24 pt-1">
        <div class="flex items-center justify-between w-full h-full wrapper-container">
          <NuxtLink to="/" aria-label="Go to homepage"
            class="flex items-center justify-center h-full cursor-pointer max-w-[64px]">
            <figure>
              <NuxtImg src="/logo/emblem.webp"
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
            <p class="md:text-small text-extraSmall text-deepBlue text-shadow">
              Ministry of education, science and technology
            </p>
            <p class="lg:text-[1.8rem] md:text-[1.4rem] text-small">
              Tanzania institute of education (TIE)
            </p>
          </div>
          <NuxtLink to="/" class="flex items-center justify-center h-full p-2 cursor-pointer">
            <NuxtImg src="/logo/logo_tie.gif" class="w-16 h-16"
              alt="An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text ‘Taasisi ya Elimu Tanzania.’ At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text ‘Elimu ni Kazi." />
          </NuxtLink>
        </div>
      </div>

      <div class="w-full ">
        <!-- Media Screen -->
        <div
          class="flex-col items-center hidden w-full gap-2 text-white md:flex md:flex-row bg-oceanBlue rounded-xs wrapper-container">
          <NuxtLink aria-label="Go home" to="/" class="flex gap-2 pl-2">
            <div class="flex items-center justify-center">
              <Icon name="ant-design:home-filled" size="20" />
            </div>
            <p class="hidden capitalize lg:flex">Home</p>
          </NuxtLink>
          <!-- TIE Library Books -->
          <a aria-label="Visit TIE online library" href="https://ol.tie.go.tz/index.php" target="_blank"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <Icon name="ph:notebook-fill" size="20" />
            </div>
            <p class="hidden capitalize lg:flex">TIE Library</p>
          </a>
          <!-- TIE AI Teacher -->
          <NuxtLink to="/tie-ai-teacher"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <Icon name="mdi:account" size="20" />
            </div>
            <p class="hidden capitalize lg:flex">TIE AI Teacher</p>
          </NuxtLink>

          <!-- title (TIE online public school) -->
          <div class="flex-1" role="navigation">
            <NuxtLink aria-label="Go home" to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                TIE online public school
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
                      <NuxtImg :src="apiDocs.baseURL.replace('v1', '') + userToken?.profilePic" alt="User Profile"
                        class="object-cover w-full h-full rounded-full" />
                    </div>
                    <Icon v-else name="iconamoon:profile-circle-thin" class="" size="2rem" />
                    <p class="capitalize text-medium line-clamp-1 max-w-60">
                      Hello,
                      {{ String(userToken.name).split(" ")[0] }}
                    </p>
                  </div>
                </div>
              </NuxtLink>

              <!-- Logout -->
              <div tabindex="0" aria-label="logout"
                class="flex items-center h-6 gap-2 p-2 text-white border-white rounded-md cursor-pointer border-1 md:h-8"
                @click="logout">
                <span class="capitalize"> Logout </span>
                <Icon name="solar:logout-2-outline" class="" size="1.2rem" title="Sign out" />
              </div>
            </div>
            <div class="flex items-center gap-4 p-2" v-else>
              <!-- sign in -->
              <NuxtLink aria-label="go to sign in page" to="/auth" title="Sign in"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <Icon name="solar:login-2-outline" class="" size="1.5rem" />
                <p class="hidden capitalize lg:flex">Sign in</p>
              </NuxtLink>

              <!-- sign up -->
              <NuxtLink aria-label="Go to sign up page" to="/auth/SignUp" title="Sign Up"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <Icon name="iconamoon:profile-thin" class="" size="1.5rem" />
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

              <NuxtLink aria-label="Go to profile page" to="/profile" v-if="userToken" class="flex items-center pl-1">
                <Icon name="iconamoon:profile-circle-thin" class="" size="1.2rem" />
              </NuxtLink>

              <NuxtLink to="/auth/SignUp" title="Sign Up" v-else
                class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                <Icon name="iconamoon:profile-thin" class="" size="1.2rem" />
              </NuxtLink>
              <!-- TIE Library Books -->
              <a aria-label="Visit TIE online library" href="https://ol.tie.go.tz/index.php" target="_blank"
                class="flex items-center justify-center gap-2 px-2 text-center text-white cursor-pointer text-medium lg:w-45"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <Icon name="ph:notebook-fill" size="20" />
                </div>
              </a>
              <!-- TIE AI Teacher -->
              <NuxtLink to="/tie-ai-teacher"
                class="flex items-center justify-center gap-2 px-2 text-center text-white cursor-pointer text-medium lg:w-45"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <Icon name="mdi:account" size="20" />
                </div>
              </NuxtLink>
            </div>

            <!-- Paragraph Text -->
            <NuxtLink to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                TIE online public school
              </p>
            </NuxtLink>

            <!-- Logout and Sign in -->
            <div class="flex items-center">
              <NuxtLink aria-label="Go home" to="/" class="flex gap-2 pr-2">
                <div class="flex items-center justify-center">
                  <Icon name="ant-design:home-filled" size="20" />
                </div>
                <p class="hidden capitalize lg:flex">Home</p>
              </NuxtLink>
              <div class="flex items-center h-6 gap-2 p-2 cursor-pointer md:h-8" @click="logout" v-if="userToken">
                <Icon name="solar:logout-2-outline" class="" size="1.2rem" title="Sign out" />
              </div>
              <!-- sign in -->
              <NuxtLink aria-label="go to sign in page" to="/auth" title="Sign in" v-else
                class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                <Icon name="solar:login-2-outline" class="" size="1.2rem" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>