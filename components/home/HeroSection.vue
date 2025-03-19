<template>
  <section class="hero-section lg:max-h-[550px] pt-10 overflow-hidden mb-2 md:mb-10">
    <div class=" grid grid-cols-1 lg:grid-cols-2 md:gap-4 ">
      <div class="flex-col items-center justify-center h-full  flex  ">
        <SliderShow />
      </div>
      <div class="flex flex-col justify-center xl:ml-10 ">
        <h1 class="md:text-extraLarge text-large font-extrabold mb-4 hidden lg:block">Welcome</h1>
        <p class="text-medium text-left max-w-2xl text-black/80 my-2 md:mb-6 ">
          Welcome to TIE ONLINE PUBLIC SCHOOL, an online platform for studying school subjects operated by the Tanzania
          Institute of Education (TIE).<br/><br/>

          We are pleased to connect you with this modern platform that gives you the opportunity to access quality
          education, learning resources, and content that meets Tanzania's curriculum guidelines. Through this system,
          you can access subjects in an easy and user-friendly way, allowing you to learn anywhere and anytime. <br/><br/>

          Feel free to explore, learn, and achieve your educational goals. Your knowledge journey begins now!
        </p>

      </div>
    </div>
  </section>
</template>

<script setup>
import SliderShow from '../slider/sliderShow.vue';
</script>
