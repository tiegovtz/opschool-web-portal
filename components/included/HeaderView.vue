<script setup>
import apiDocs from "~/utilities/api-docs"

const userToken = useCookie('signInUserToken')

const logout = () => {
  userToken.value = null;
  // Dismiss Drop Down
  dropDown();
}

const isPop = ref(true)

const dropDown = () => {
  isPop.value = !isPop.value;
}


</script>

<template>
  <!-- Header -->
  <header class="relative bg-grayLight shadow-sm ">


    <nav class="wrapper-container flex flex-col items-center">
      <!-- Phone Number -->
      <div class="md:flex hidden md:flex-row flex-col items-center bg-oceanBlue w-full rounded-b-md text-white">

        <div class="title px-2 lg:text-large text-medium font-medium uppercase text-shadow flex-1 text-center">
          <p class="relative xl:left-40 z-0">TIE online public school</p>
        </div>
        <div class="info">
          <div class="flex items-center py-1 px-2 gap-4" v-if="userToken">
            <div class="overflow-hidden rounded-full flex items-center justify-center">
              <div class="flex items-center gap-1 cursor-pointer">
                <NuxtImg v-if="userToken?.profilePic" :src="apiDocs.baseURL" alt="User Profile"
                  class="w-full h-full object-cover" />
                <Icon v-else name="iconamoon:profile-circle-thin" class="" size="2rem" />
                <p class=" text-medium capitalize line-clamp-1 max-w-60">Hello, {{ userToken?.name ?
                  String(userToken.name).split(' ')[0]
                  : 'friend' }}
                </p>
              </div>
            </div>
            <div
              class="flex items-center gap-2 cursor-pointer  text-white border-1 md:h-8 h-6 p-2 border-white rounded-md"
              @click="logout">
              <span class="capitalize">
                Logout
              </span>
              <Icon name="solar:logout-2-outline" class="" size="1.2rem" title="Sign out" />
            </div>
          </div>
          <div class="p-2 flex items-center gap-4" v-else>
            <!-- sign in -->
            <NuxtLink to="/auth" title="Sign in"
              class="flex items-center gap-2 cursor-pointer  text-white border-1  md:h-8 h-6 px-1 border-white rounded-md">
              <Icon name="solar:login-2-outline" class="" size="1.5rem" />
              Sign in
            </NuxtLink>

            <!-- sign up -->
            <NuxtLink to="/auth/SignUp" title="Sign Up"
              class="flex items-center gap-2 cursor-pointer  text-white border-1 md:h-8 h-6 px-1 border-white rounded-md">
              <Icon name="iconamoon:profile-thin" class="" size="1.5rem" />
              Create Account
            </NuxtLink>
          </div>

        </div>
      </div>

      <!-- Mobile Menu -->
      <div class="flex md:hidden md:flex-row flex-col items-center bg-oceanBlue w-full rounded-b-md text-white">

        <!-- Profile and Sign Up -->
        <div class="flex items-center justify-between w-full">
         <div class="flex items-center">
          <Icon v-if="userToken" name="iconamoon:profile-circle-thin" class="" size="1.2rem" />
          <NuxtLink to="/auth/SignUp" title="Sign Up" v-else
            class="flex items-center gap-2 cursor-pointer md:h-8 h-6 px-1">
            <Icon name="iconamoon:profile-thin" class="" size="1.2rem" />
          </NuxtLink>
         </div>
         
         <!-- Paragraph Text -->
          <p class="font-medium uppercase text-shadow">TIE online public school</p>

          <!-- Logout and Sign in -->
          <div class="flex items-center">
            <div class="flex items-center gap-2 cursor-pointer md:h-8 h-6 p-2" @click="logout"  v-if="userToken">
            <Icon name="solar:logout-2-outline" class="" size="1.2rem" title="Sign out" />
          </div>
           <!-- sign in -->
           <NuxtLink to="/auth" title="Sign in" v-else
              class="flex items-center gap-2 cursor-pointer md:h-8 h-6 px-1">
              <Icon name="solar:login-2-outline" class="" size="1.2rem" />
            </NuxtLink>
          </div>
        </div>

      </div>
      <!-- Header -->
      <div
        class="relative w-full h-20  mt-1 bg-[url('/public/flag/Flag_of_Tanzania.gif')] bg-cover bg-center bg-no-repeat">
        <div class="absolute top-0 left-0 z-0 w-full h-full bg-[#f0f0f0e0]"></div>
        <div class="flex justify-between items-center w-full h-full absolute top-0 left-0  ">
          <NuxtLink to="/" class="flex items-center justify-center bg-grayLight shadow-2xl shadow-grayLight h-full ">
            <NuxtImg src="/logo/emblem.webp" alt="EMBLEM" class="w-18 h-18" />
          </NuxtLink>
          <div class="title flex flex-col items-center text-center gap-1  h-full">
            <p class="lg:text-large md:text-medium text-extraSmall font-bold uppercase text-shadow">wizara ya elimu,
              sayansi na teknolojia </p>
            <p class="lg:text-medium md:text-small text-smallest capitalize">taasisi ya elimu tanzania (TET)</p>
          </div>
          <NuxtLink to="/" class="cursor-pointer p-2 h-full bg-grayLight shadow-2xl shadow-grayLight ">
            <NuxtImg src="/logo/logo_tie.webp" alt="TIE LOGO" class="w-14 h-14" />
          </NuxtLink>
        </div>
      </div>

    </nav>
  </header>
</template>