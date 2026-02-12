<script setup>
import { screenWidth } from '~/utilities/controlls';
</script>

<template>
  <!-- Footer -->
  <footer class="text-white bg-oceanBlue transition-all duration-700 ease-in-out">
   <div class="p-4">
    <div class="flex flex-col items-center justify-between gap-2 xl:flex-row wrapper-container">
      <div class="flex flex-col items-start gap-1 text-center">
        <p class="">
          P.O. Box 35094, Dar es Salaam, Tanzania
        </p>
        <div class="inline-flex flex-wrap items-center gap-2">
           <a href="tel:+255735041168" class="flex items-center gap-1 cursor-pointer"> 
            <Icon name="fa:phone" class=""/>+255-735-041168
          </a>
          <span aria-label="vertical line separator"> | </span>
           <a href="mailto:director.general@tie.go.tz" class="flex items-center gap-1 cursor-pointer">
            <Icon name="ic:round-email" class=""/> director.general@tie.go.tz 
          </a>
        </div>
      </div>
      <!-- Canada and unicef Logo -->
      <div tabindex="0" class="flex items-center justify-center h-12 gap-2 px-4 bg-white rounded-md">
        <a href="http://www.canada.ca/" target="_blank" aria-label="Visit Government of Canada website"
          class="flex items-center justify-center h-full cursor-pointer max-w-[100px] ">
          <img src="/logo/image001.jpg" alt="Government of Canada logo showing the red Canadian flag and the word Canada with a small red maple leaf above the letter d. The canada flag - A red and white flag with a red vertical bar on the left, another red vertical bar on the right, and a white square in the center featuring a red maple leaf with eleven points." class="object-contain w-full h-full" />
        </a>
        <a href="http://www.unicef.org/" target="_blank" aria-label="Visit UNICEF website" class="flex items-center justify-center h-full cursor-pointer">
          <img src="/logo/image002.png" alt="The UNICEF logo displays the word ‘unicef’ in lowercase light-blue letters. Next to the text is the United Nations emblem, also in light blue: a globe shown from above with latitude and longitude lines, surrounded on both sides by curved olive branches forming a circular wreath." class="object-contain w-full h-full" />
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
        <HomeAppDownload />
      </div>
    </div>
   </div>
   <div class="p-2 bg-deepBlue">
    <p class="text-center">
      All Rights Reserved &copy; <span v-if="screenWidth >= 640">Tanzania Institute of Education</span>
      <span v-else>TIE</span>
    </p>
   </div>
  </footer>
</template>