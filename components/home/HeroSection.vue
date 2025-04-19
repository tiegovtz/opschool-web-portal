<template>
  <section class="my-2 hero-section flex justify-center">
    <div class="grid grid-cols-1 xl:grid-cols-2 md:gap-2">
      <div class="flex flex-col items-center justify-center h-full">
        <SliderShow />
      </div>
      <div class="flex flex-col xl:ml-10">
        <h1 class="hidden mb-4 font-extrabold md:text-extraLarge text-large xl:block">
          Welcome
        </h1>
        <p class="my-2 text-justify text-medium  text-black/80">
          Welcome to <b>TIE ONLINE PUBLIC SCHOOL</b>, a cutting-edge platform developed by the
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
          educational journey that will empower you to achieve great things.
          <b>Welcome onboard!</b>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SliderShow from "../slider/sliderShow.vue";
</script>
