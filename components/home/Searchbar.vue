<script setup>

const search = () => {
  console.log('searching')
}


</script>

<template>
         <!-- Search Form -->
    <form action="" @submit.prevent="search"
    class="flex w-full max-w-md h-10 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue">
      <div class="flex items-center w-full">
        <!-- Search Icon -->
        <Icon name="mdi:magnify" class="text-gray-400" size="1.5rem" />

        <!-- Search Input -->
        <input type="text" placeholder="Search" class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue" />
      </div>

      <!-- Search Button -->
      <button type="submit"
        class="text-white p-2 rounded-t-md rounded-b-none  bg-oceanBlue hover:bg-oceanBlue/80 transition duration-500 cursor-pointer">
        Search
      </button>
    </form>
</template>