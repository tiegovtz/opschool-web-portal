<template>
  <section class="hero-section h-[400px] pt-10">
    <div class="container grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col items-center justify-center h-[300px]">
        <SliderShow />
      </div>
      <div class="flex flex-col justify-center ml-10">
        <h1 class="text-extraLarge font-extrabold text-gray-800 mb-4">Welcome</h1>
        <p class="text-medium text-gray-600/60 mb-6">
          What do you want to learn today?
        </p>

        <!-- Search Form -->
        <form action="" class="flex items-center w-full px-2 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 mt-auto rounded-lg bg-gray-500/20">
          <!-- Search Icon -->
          <Icon
            name="mdi:magnify"
            class="text-gray-500 p-4 border border-gray-300 rounded-l-lg h-full flex items-center justify-center"
            size="1.5rem"
          />

          <!-- Search Input -->
          <input
            type="text"
            placeholder="Search for anything to learn"
            class="flex-grow h-full focus:outline-none px-2"
          />

          <!-- Search Button -->
          <button
            type="submit"
            class="bg-oceanBlue text-white p-4 rounded-r-lg hover:bg-blue-400 transition duration-500 cursor-pointer"
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
