<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100" v-trusted>
        <div class="p-8 text-center bg-white rounded-lg shadow-lg w-72">
            <NuxtImg  src="/logo/logo_tie.gif"class="w-24 h-24 mx-auto mb-6" alt="logo" />
            <h1 class="mb-4 text-4xl font-bold text-red-500">403</h1>
            <p class="mb-6 text-xl text-gray-700">Access Denied</p>
            <nuxt-link to="/" class="inline-block px-6 py-3 text-white transition-all duration-300 rounded-md bg-oceanBlue hover:bg-oceanBlue/80">Go Home</nuxt-link>
        </div>
    </div>
</template>