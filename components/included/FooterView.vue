<script setup>
import { screenWidth} from '~/utilities/controlls';
</script>

<template>
    <!-- Footer -->
    <footer class="p-4 text-white bg-oceanBlue">
      <div class="flex flex-col items-center justify-between gap-2 wrapper-container xl:flex-row">
        <p class="text-center">
            All Rights Reserved &copy; <span v-if="screenWidth >= 640">Tanzania Institute of Education</span> 
            <span v-else>TIE</span> 
        </p>
        <div class="flex items-center gap-4">
          <!-- <ul class="items-center hidden gap-6  lg:flex">
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
    </footer>
</template>