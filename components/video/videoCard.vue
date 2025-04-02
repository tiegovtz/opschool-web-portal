<script setup>
</script>

<template>
    <NuxtLink to="/video/form-one/physics/introduction-to-physics/1"
        class="relative flex flex-col rounded-lg overflow-hidden bg-white hover:bg-deepBlue shadow-md hover:shadow-xl transition-all duration-500 ease-in-out group cursor-pointer"
        style="height: 350px;">
        <!-- Thumbnail section -->
        <div class="relative overflow-hidden" style="height: 280px;">
            <NuxtImg src="https://i.pinimg.com/1200x/12/89/fc/1289fcdc3cb80e0178f5cc32ed6a4b96.jpg"
                alt="Introduction to Physics" class="w-full h-full object-cover transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>

            <!-- Play button -->
            <div
                class="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer">
                <button
                    class="flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm p-3 border border-white/30 transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                    aria-label="Play video">
                    <Icon name="heroicons:play-solid" class="text-white text-2xl" />
                </button>
            </div>
        </div>

        <!-- Content section -->
        <div class="flex flex-col p-4 flex-grow">
            <h3
                class="text-lg font-semibold mb-2 group-hover:text-white transition-colors duration-500 ease-in-out capitalize">
                Introduction to Physics</h3>
            <p
                class="text-sm text-gray-600  group-hover:text-white transition-colors duration-500 ease-in-out mb-4 line-clamp-2">
                If you need to use environment variables outside Vue components, pass useRuntimeConfig() manually or
                store it in a global variable.
            </p>

            <!-- Metadata footer -->
            <div
                class="mt-auto flex items-center justify-end text-xs text-gray-500 group-hover:text-white transition-colors duration-500 ease-in-out">
                <span class="flex items-center">
                    <Icon name="heroicons:eye" class="mr-1 text-sm" />
                    1.2k views
                </span>
            </div>
        </div>
    </NuxtLink>
</template>