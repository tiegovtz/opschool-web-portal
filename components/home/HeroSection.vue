<template>
  <section class="hero-section md:h-[400px] pt-10 overflow-hidden md:mb-0 mb-10">
    <div class=" grid grid-cols-1 md:grid-cols-2 md:gap-4">
      <div class="flex-col items-center justify-center h-[300px] hidden md:flex  ">
        <SliderShow />
      </div>
      <div class="flex flex-col justify-center md:ml-10 ">
        <h1 class="text-extraLarge font-extrabold text-gray-800 mb-4">Welcome</h1>
        <p class="text-medium text-gray-600/60 mb-6">
          What do you want to learn today?
        </p>

        <!-- Search Form -->
        <form action="" @submit.prevent="search" class="flex items-center w-full md:p-2 p-3 focus:outline-none focus:ring-2 focus:ring-gray-400 mt-auto rounded-lg bg-gray-500/20 ">
          <!-- Search Icon -->
          <Icon
            name="mdi:magnify"
            class="text-gray-500  border border-gray-300 rounded-l-lg h-full flex items-center justify-center"
            size="1.5rem"
          />

          <!-- Search Input -->
          <input
            type="text"
            placeholder="Search for anything to learn"
            class="flex-1 h-full focus:outline-none "
          />

          <!-- Search Button -->
          <button
            type="submit"
            class="bg-oceanBlue text-white p-2 md:p-4 md:flex hidden rounded-r-lg hover:bg-blue-400 transition duration-500 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import SliderShow from '../slider/sliderShow.vue';
</script>
