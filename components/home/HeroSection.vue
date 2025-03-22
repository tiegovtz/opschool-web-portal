<template>
  <section class="hero-section lg:max-h-[600px] pt-10 overflow-hidden mb-2 md:mb-10">
    <div class="grid grid-cols-1 lg:grid-cols-2 md:gap-4">
      <div class="flex-col items-center justify-center h-full flex">
        <SliderShow />
      </div>
      <div class="flex flex-col justify-center xl:ml-10">
        <h1 class="md:text-extraLarge text-large font-extrabold mb-4 hidden lg:block">
          Welcome
        </h1>
        <p class="text-medium text-left xl:max-w-2xl text-black/80 my-2 md:mb-6">
          Welcome to <b>TIE ONLINE SCHOOL</b>, a cutting-edge platform developed by the
          Tanzania Institute of Education (TIE) to help you reach your
          educational goals through innovative and engaging methods. Here,
          you'll have access to top-quality digital learning resources for
          secondary education, carefully crafted to provide you with the best
          possible educational experience. <br /><br />
          By utilizing these resources, you'll
          be able to learn effectively and efficiently, while being inspired to
          reach your full potential. This platform is designed to equip you with
          the essential knowledge, skills, and competencies needed for your
          academic growth, while also preparing you for future challenges. <br /><br />
          Embrace modern learning and take advantage of the flexibility to study
          anytime, anywhere. Join this groundbreaking platform and embark on an
          educational journey that will empower you to achieve great things.<br />
          <b>Welcome aboard!</b>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SliderShow from "../slider/sliderShow.vue";
</script>
