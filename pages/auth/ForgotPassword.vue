<template>
    <div class="flex items-center justify-center min-h-screen">
        <div class="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
            <h1 class="text-large font-bold text-center">Forgot Password</h1>
            <NuxtImg src="/logo/logo_tie.png" class="w-20 h-20 mx-auto my-6" alt="logo" />
            <form @submit.prevent="forgotPassword" class="px-4">
                <div class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                    <input type="email" id="email" v-model="email" name="email" autocomplete="off"
                        class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                        placeholder="Email ( eg:example@gmail.com )">
                        <Icon name="mdi-light:email" class="h-5 w-5 text-textGray focus:text-oceanBlue" />
                </div>
                <button type="submit"
                    class="w-full p-2 bg-oceanBlue text-white rounded-md cursor-pointer hover:bg-oceanBlue/80 transition-all duration-500">Forgot Password</button>
            </form>
            <div class="mt-4 text-center">
                <p class="text-sm text-textGray">Back to <NuxtLink to="/auth" class="text-oceanBlue cursor-pointer">Sign In</NuxtLink></p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const email = ref('')

const forgotPassword = () => {
  // TODO: Implement forgot password logic
  console.log('Forgot password for:', email.value)
}
</script>

