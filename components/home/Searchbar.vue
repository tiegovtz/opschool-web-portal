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
        class="border-1 border-gray-300 hover:border-oceanBlue text-gray-400  hover:text-white p-2 rounded-t-md rounded-b-none hover:bg-oceanBlue transition duration-500 cursor-pointer">
        Search
      </button>
    </form>
</template>