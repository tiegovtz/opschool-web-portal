<script setup>
import {computed } from "vue";

// Define Cookie
const userToken = useCookie('signInUserToken').value;

// Get initials from logedAs state
const initials = computed(() => {
  const name = String(userToken.name).split(" ");
  if (name.length > 1) {
    return (name[0].charAt(0) + name[1].charAt(0)).toUpperCase();
  } else {
    return name[0].charAt(0).toUpperCase();
  }
});

</script>

<template>
  <!-- SVG to display the initials -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
  >
  <title>Account bellong to :{{ userToken.name }} </title>
    <!-- Circle background -->
    <circle
      cx="50"
      cy="50"
      r="48"
    />
    <!-- Text initials -->
    <text
      x="50"
      y="50"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="Poppins, sans-serif"
    >
      {{ initials }}
    </text>
  </svg>
</template>

<style scoped>
svg {
  border-radius: 50%;
  background: #f0f0f0;
  border: 3px solid #0077c5;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

}

svg circle{
  fill: #f0f0f0;
}

svg text{
  fill: #0077c5;
  font-size: 3rem;
  font-weight: 600;
}

svg title{
  text-transform: capitalize;
}
</style>

