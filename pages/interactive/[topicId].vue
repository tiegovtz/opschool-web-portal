<template>
  <section class="relative w-full h-full inline-flex">
    <div class="bg-blue-500 lg:w-3/4 w-full center-height p-5">

      <div class="flex items-center justify-between">
        <h1>Interactive Topics</h1>
        <Icon name="basil:menu-outline" class="cursor-pointer  lg:hidden flex" size="2rem" />
      </div>
      <p>{{ topicId }}</p>
    </div>
    <div class="absolute right-0 top-0 bg-red-500 w-1/4  center-height p-5">
      <h1>Sidebar</h1>
    </div>
  </section>
</template>

<script setup>
const route = useRoute()
const topicId = route.fullPath.split('/').pop()
console.log(topicId)

// const toggleSidebar = () => {
//   const sidebar = document.querySelector('.sidebar')
//   sidebar.classList.toggle('hidden')
// }
</script>
