<script setup>
import { ref } from "vue";
import SliderShow from "../slider/sliderShow.vue";

// Define the full text
const fullText = `
Welcome to <b>TIE ONLINE PUBLIC SCHOOL</b>, an innovative platform developed by the
Tanzania Institute of Education (TIE) to assist you in reaching your educational goals
through engaging methods. Here, you will access high-quality learning resources for
secondary education, thoughtfully made to give you the best experience. <br/><br/>

These resources will enable you to learn efficiently and effectively while inspiring you to
reach your full potential. This platform has been designed carefully to offer you the
necessary knowledge, skills, and competencies for your learning progress and prepare
you for the challenges ahead. <br/><br />

Embrace modern learning and take advantage of the flexibility to study anytime,
anywhere. Join this new platform and start an academic pursuit that will enable you to
soar to greater heights. <br/><b>Welcome onboard!</b>
`;

// Define the short preview text
const shortText = `
Welcome to <b>TIE ONLINE PUBLIC SCHOOL</b>, an innovative platform developed by the
Tanzania Institute of Education (TIE) to assist you in reaching your educational goals
through engaging methods. Here, you will access high-quality learning resources for
secondary education, thoughtfully made to give you the best experience. <br /><br />

These resources will enable you to learn efficiently and effectively while inspiring you to
reach your full potential. This platform has been designed carefully to offer you the
necessary knowledge, skills, and competencies for your learning progress and prepare
you for the challenges ahead. <br/><br />
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
      <div class="flex flex-col h-full xl:ml-10">
        <h1 class="hidden mb-4 font-extrabold md:text-extraLarge text-large xl:block">
          Welcome
        </h1>
        
        <p class="mt-2 text-justify text-black text-medium text-opacity-80" v-html="isExpanded ? fullText : shortText"></p>

        <button
          @click="toggleReadMore"
          class="self-start text-sm underline cursor-pointer text-oceanBlue"
        >
          {{ isExpanded ? 'Show Less' : 'Read More' }}
        </button>
        
        <div :class="[
          'overflow-hidden rounded-md mt-auto transition-all duration-500 ease-in-out bg-gradient-to-b',
          isExpanded ? 'h-0' : 'h-44'
        ]">
          <NuxtImg src="/images/4.banner_miaka_50_transparent.gif" alt="banner_miaka_50" class="object-contain w-full h-full" />
        </div>
      </div>
    </div>
  </section>
</template>
