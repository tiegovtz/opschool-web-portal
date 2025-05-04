<script setup>
import { screenWidth } from '~/utilities/controlls';
</script>

<template>
  <!-- Footer -->
  <footer class="p-4 text-white bg-oceanBlue">
    <div class="flex flex-col items-center justify-between gap-2 xl:flex-row wrapper-container">
      <p class="text-center">
        All Rights Reserved &copy; <span v-trusted v-if="screenWidth >= 640">Tanzania Institute of Education</span>
        <span v-trusted v-else>TIE</span>
      </p>
      <!-- Canada and unicef Logo -->
      <div class="flex items-center justify-center h-12 gap-2 px-4 bg-white rounded-md">
        <a href="http://www.canada.ca/" target="_blank"
          class="flex items-center justify-center h-full cursor-pointer max-w-[100px] ">
          <NuxtImg src="/logo/image001.jpg" alt="EMBLEM" class="object-contain w-full h-full" />
        </a>
        <a href="http://www.unicef.org/" target="_blank" class="flex items-center justify-center h-full cursor-pointer">
          <NuxtImg src="/logo/image002.png" alt="EMBLEM" class="object-contain w-full h-full" />
        </a>
      </div>

      <div class="flex items-center gap-4">
        <!-- <ul class="items-center hidden gap-6 lg:flex">
          <li>
            <NuxtLink to="/contact" class="text-white uppercase">contact</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/faq" class="text-white uppercase">faq</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/updates" class="text-white uppercase">updates</NuxtLink>
          </li>
          </ul> -->

        <!-- App Download -->
        <HomeAppDownload v-trusted />
      </div>
    </div>
  </footer>
</template>