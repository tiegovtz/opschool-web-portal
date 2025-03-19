<template>
  <section class="hero-section lg:max-h-[550px] pt-10 overflow-hidden mb-2 md:mb-10">
    <div class=" grid grid-cols-1 lg:grid-cols-2 md:gap-4 ">
      <div class="flex-col items-center justify-center h-full  flex  ">
        <SliderShow />
      </div>
      <div class="flex flex-col justify-center xl:ml-10 ">
        <h1 class="md:text-extraLarge text-large font-extrabold text-gray-800 mb-4 hidden lg:block">Welcome</h1>
        <p class="text-medium text-center md:text-left  lg:text-gray-600/60 my-2 md:mb-6 ">
          
        </p>
      
      </div>
    </div>
  </section>
</template>

<script setup>
import SliderShow from '../slider/sliderShow.vue';
</script>
