<script setup>
import messages from "~/utilities/messages";
import apiDocs from "~/utilities/api-docs";
 

const route = useRoute();
const reset_token_password = route.query.token;

const userResetPassword = reactive({
    password: null,
    confirmPassword: null,
    controller: {
        feedback: null,
        isSucces: false,
        errors: {
            password: null,
            confirmPassword: null,
        }
    }
})

const resetPassword = async () => {

    // check password input is empty
    if (!userResetPassword.password || userResetPassword.password.trim() == '') {
        userResetPassword.controller.errors.password = messages.error.form.passwordRequired;
        return;
    }
    // check confirm password input is empty
    if (!userResetPassword.confirmPassword || userResetPassword.confirmPassword.trim() == '') {
        userResetPassword.controller.errors.confirmPassword = messages.error.form.confirmPassword;
        return;
    }

    // check reset token password is not empty
    if (!reset_token_password) {
        userResetPassword.controller.isSent = 'error';
        userResetPassword.controller.feedback = messages.error.auth.noToken;

        // clear the error message feedback
        setTimeout(() => {
            userResetPassword.controller.isSent = null;
            userResetPassword.controller.feedback = null;

        }, 4000)

        return;
    }


    try {
        // sent the data to server
        const response = await $fetch(apiDocs.auth.resetPassword, {
            method: "POST",
            body: {
                "password": userResetPassword.password,
                "code": reset_token_password,
                "confirmPassword": userResetPassword.confirmPassword,
            }
        })
        // check the response with statusCode
        if (response.status >= 200 && response.status < 300) {
            userResetPassword.controller.isSucces = true;
            userResetPassword.controller.isSent = 'success';
            userResetPassword.controller.feedback = messages.success.auth.passwordChanged;

            // clear the error message feedback and redirect to auth page
            setTimeout(() => {
                const route = useRouter();
                route.replace('/auth')

                userResetPassword.controller.isSent = 'success';
                userResetPassword.controller.isSucces = false;
                userResetPassword.controller.feedback = null;
            }, 3000);
        }

    } catch (error) {
        userResetPassword.controller.isSent = 'error';
        userResetPassword.controller.feedback = messages.error.server.internalError;
    }

    // clear all error message feedback
    setTimeout(() => {
        userResetPassword.controller.feedback = null;
        userResetPassword.controller.isSucces = false;
        userResetPassword.controller.isDisabled = false;
    }, 4000);
}


// password watching
watch(
    () => userResetPassword.password,
    (password) => {
        // Validate Password
        if (password) {
            if (password.length < 6) {
                userResetPassword.controller.errors.password =
                    messages.error.passwordStrength.hasMinLength;
            } else {
                userResetPassword.controller.errors.password = null;
            }
        } else {
            userResetPassword.controller.errors.password = null;
        }
    }
);
// confirm password watching
watch(
    () => userResetPassword.confirmPassword,
    (confirmPassword) => {
        if (confirmPassword) {
            if (userResetPassword.confirmPassword !== userResetPassword.password) {
                userResetPassword.controller.errors.confirmPassword =
                    messages.error.form.confirmPassword;
            } else {
                userResetPassword.controller.errors.confirmPassword = null;
            }
        } else {
            userResetPassword.controller.errors.confirmPassword = null;
        }
    }
);

// Password toggle
const showPassword = ref(false);
const togglePassword = () => {
    showPassword.value = !showPassword.value;
};
// Confirm Password toggle
const showConfirmPassword = ref(false);
const toggleConfirmPassword = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};
</script>

<template>
    <section class="flex items-center justify-center min-h-screen md:bg-gradient-to-b">
        <!-- Message Component -->
        <MessageComponent :message="userResetPassword.controller.feedback"
            :position="userResetPassword.controller.feedback ? true : false"
            :event-type="userResetPassword.controller.isSucces ? 'success' : 'error'"
            :icon="userResetPassword.controller.isSucces ? 'icons8:checked' : 'oui:cross-in-circle-empty'" />

        <div class="w-full max-w-md md:bg-white rounded-lg md:shadow-2xl md:pt-3">
            <h1 class="text-large font-bold text-center">Reset Password</h1>
           <NuxtLink to="/" class="w-[100px] h-[100px] mx-auto my-6 flex items-center justify-center">
                <NuxtImg src="/logo/logo_tie.webp" class="w-full h-full object-contain" alt="logo" />
            </NuxtLink>
            <form @submit.prevent="resetPassword"
                class="px-4 md:h-[200px] h-dvh text-textGray overflow-hidden text-extraSmall">
                <!-- New Password -->
                <div class="focus-input-icon px-2 mb-4 flex flex-col items-start justify-between border-b border-gray-300 focus-within:border-oceanBlue"
                    :class="{ 'focus-input-icon-warning focus-within:border-red-500 border-red-500': userResetPassword.controller.errors.password }">
                    <div class="flex w-full items-center">
                        <input :type="showPassword ? 'text' : 'password'" id="password"
                            v-model="userResetPassword.password" name="password"
                            class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                            placeholder="New Password ">
                        <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                            class="h-5 w-5 cursor-pointer text-textGray" @click="togglePassword" />
                    </div>

                    <!-- New Password error message -->
                    <small v-if="userResetPassword.controller.errors.password"
                        class="text-red-500 text-smallest w-full">
                        {{ userResetPassword.controller.errors.password }}
                    </small>
                </div>

                <!-- Confirm Password -->
                <div class="focus-input-icon px-2 mb-4 flex flex-col items-start justify-between border-b border-gray-300 focus-within:border-oceanBlue"
                    :class="{ 'focus-input-icon-warning focus-within:border-red-500 border-red-500': userResetPassword.controller.errors.password }">
                    <div class="flex w-full items-center">
                        <input :type="showConfirmPassword ? 'text' : 'password'" id="password"
                            v-model="userResetPassword.confirmPassword" name="password"
                            class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                            placeholder="Confirm Password ">
                        <Icon :name="showConfirmPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                            class="h-5 w-5 cursor-pointer text-textGray" @click="toggleConfirmPassword" />
                    </div>

                    <!-- New Password error message -->
                    <small v-if="userResetPassword.controller.errors.confirmPassword"
                        class="text-red-500 text-smallest w-full">
                        {{ userResetPassword.controller.errors.confirmPassword }}
                    </small>
                </div>

                <!-- Reset Password Button -->
                <button type="submit" :disabled="isDisable"
                    class="w-full p-2 bg-oceanBlue text-white disabled:bg-gray-500/40 disabled:cursor-not-allowed gap-3 flex items-center justify-center rounded-md cursor-pointer hover:bg-oceanBlue/80 transition-all duration-500 capitalize">
                    Reset Password
                    <Icon name="eos-icons:loading" class="text-white" size="20" v-if="isDisable" />
                </button>

            </form>
        </div>
    </section>
</template>
