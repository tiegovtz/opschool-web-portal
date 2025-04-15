<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100" v-trusted>
        <div class="bg-white p-8 w-72 rounded-lg shadow-lg text-center">
            <NuxtImg src="/logo/logo_tie.webp" class="w-24 h-24 mx-auto mb-6" alt="logo" />
            <h1 class="text-4xl font-bold text-red-500 mb-4">404</h1>
            <p class="text-xl text-gray-700 mb-6">Page Not Found</p>
            <nuxt-link to="/" class="inline-block px-6 py-3 bg-oceanBlue text-white rounded-md hover:bg-oceanBlue/80 transition-all duration-300">Go Home</nuxt-link>
        </div>
    </div>
</template> 