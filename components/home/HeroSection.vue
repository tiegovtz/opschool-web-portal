<script setup>
import { ref } from "vue";
import SliderShow from "../slider/sliderShow.vue";

// Define the full text
const fullText = `
Welcome to <b>TIE ONLINE PUBLIC SCHOOL</b>, a cutting-edge platform developed by the
Tanzania Institute of Education (TIE) to help you reach your educational goals through innovative and engaging methods. Here,
you'll have access to top-quality digital learning resources for secondary education, carefully crafted to provide you with the best
possible educational experience. <br /><br />
By utilizing these resources, you'll be able to learn effectively and efficiently, while being inspired to reach your full potential.
This platform is designed to equip you with the essential knowledge, skills, and competencies needed for your academic growth, while
also preparing you for future challenges. <br /><br />
Embrace modern learning and take advantage of the flexibility to study anytime, anywhere. Join this groundbreaking platform and embark
on an educational journey that will empower you to achieve great things. <b>Welcome onboard!</b>
`;

// Define the short preview text
const shortText = `
Welcome to <b>TIE ONLINE PUBLIC SCHOOL</b>, a cutting-edge platform developed by the
Tanzania Institute of Education (TIE) to help you reach your educational goals through innovative and engaging methods. Here,
you'll have access to top-quality digital learning resources for secondary education, carefully crafted to provide you with the best
possible educational experience. <br /><br />
`;

// Track if the user has clicked "Read More"
const isExpanded = ref(false);

// Toggle function
const toggleReadMore = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <section class="flex justify-center my-2 hero-section">
    <div class="grid grid-cols-1 xl:grid-cols-2 md:gap-2">
      <div class="flex flex-col items-center justify-center h-full">
        <SliderShow />
      </div>
      <div class="flex flex-col xl:ml-10">
        <h1 class="hidden mb-4 font-extrabold md:text-extraLarge text-large xl:block">
          Welcome
        </h1>
        
        <p class="my-2 text-justify text-black text-medium text-opacity-80" v-html="isExpanded ? fullText : shortText"></p>

        <button
          @click="toggleReadMore"
          class="self-start text-sm underline cursor-pointer text-oceanBlue"
        >
          {{ isExpanded ? 'Show Less' : 'Read More' }}
        </button>
        <div :class="[
          'overflow-hidden rounded-md mt-2 transition-all duration-500 ease-in-out bg-gradient-to-b',
          isExpanded ? 'h-0' : 'h-44'
        ]">
          <NuxtImg src="/images/3.banner_miaka_50_transparent.gif" alt="banner_miaka_50" class="object-contain w-full h-full" />
        </div>
      </div>
    </div>
  </section>
</template>
