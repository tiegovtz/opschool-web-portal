<template>
    <div class="flex items-center justify-center min-h-screen">
        <div class="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
            <h1 class="text-large font-bold text-center">Welcome</h1>
            <NuxtImg src="/logo/logo_tie.png" class="w-20 h-20 mx-auto my-6" alt="logo" />
            <form @submit.prevent="signIn" class="px-4">
                <div class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                    <input type="text" id="username" v-model="username" name="username" autocomplete="off"
                        class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                        placeholder="username">
                        <Icon name="solar:user-outline" class="h-5 w-5 text-textGray" />
                </div>
                <div
                    class="focus-input-icon mb-4 flex items-center justify-between border-b border-gray-300 focus-within:border-oceanBlue">
                    <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" name="password"
                        class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                        placeholder="password">
                    <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                        class="h-5 w-5 cursor-pointer text-textGray" @click="togglePassword" />
                </div>
                <div class="my-6 flex items-center justify-between">
                    <NuxtLink to="/auth/ForgotPassword" class="text-sm text-textGray cursor-pointer">Forgot Password?
                    </NuxtLink>
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="remember" v-model="remember" class="w-4 h-4 cursor-pointer">
                        <label for="remember" class="text-sm text-textGray cursor-pointer">Remember me</label>
                    </div>
                </div>
                <button type="submit" class="w-full p-2 bg-oceanBlue text-white rounded-md cursor-pointer hover:bg-oceanBlue/80 transition-all duration-500 capitalize">Sign
                    In</button>

                    <!-- sign up -->
                    <div class="my-4 flex flex-col items-center gap-4">
                        <p class="text-sm text-textGray">Don't have an account?</p>
                        <NuxtLink to="/auth/SignUp"
                                class="w-full p-2 text-center cursor-pointer bg-darkBlue text-white rounded-md hover:bg-darkBlue/80 transition-all duration-500 capitalize">Sign Up</NuxtLink>
                    </div>
            </form>
        </div>
    </div>
</template>

<script setup>
// Password toggle
const showPassword = ref(false)
const togglePassword = () => {
    showPassword.value = !showPassword.value
}
</script>