<template>
         <!-- Search Form -->
    <form action="" @submit.prevent="search"
      class="flex items-center w-full max-w-md focus:outline-none focus:ring-2 focus:ring-gray-400 mt-auto rounded-lg bg-gray-100 p-2">
      <div class="flex items-center w-full">
        <!-- Search Icon -->
        <Icon name="mdi:magnify" class="text-gray-400" size="1.5rem" />

        <!-- Search Input -->
        <input type="text" placeholder="Search" class="flex-1 h-full focus:outline-none caret-gray-400 px-2" />
      </div>

      <!-- Search Button -->
      <button type="submit"
        class="bg-oceanBlue text-white p-2 rounded-lg hover:bg-blue-400 transition duration-500 cursor-pointer">
        Search
      </button>
    </form>
</template>