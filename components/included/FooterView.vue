<script setup>
import { screenWidth} from '~/utilities/controlls';
</script>

<template>
    <!-- Footer -->
    <footer class="bg-oceanBlue text-white p-4">
      <div class="wrapper-container flex justify-between items-center lg:flex-row flex-col gap-2">
        <p class="text-center">
            All Rights Reserved &copy; <span v-if="screenWidth >= 640">Tanzania Institute of Education</span> 
            <span v-else>TIE</span> 
        </p>
        <ul class=" lg:flex hidden items-center gap-6">
          <li>
            <NuxtLink to="/contact" class="text-white uppercase">contact</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/faq" class="text-white uppercase">faq</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/updates" class="text-white uppercase">updates</NuxtLink>
          </li>
          </ul>
      </div>
    </footer>
</template>