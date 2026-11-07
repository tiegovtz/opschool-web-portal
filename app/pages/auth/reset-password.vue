<script setup>
import messages from "~/utilities/messages";
import apiDocs from "~/utilities/apiDocs";
import { getNewPasswordChecks, getNewPasswordIssue } from "~/utilities/newPasswordPolicy";


const route = useRoute();
const reset_token_password = route.query.token;

const headingRef = ref(null);

const userResetPassword = reactive({
    password: null,
    confirmPassword: null,
    isDisable: false,
    controller: {
        feedback: null,
        isSucces: false,
        errors: {
            password: null,
            confirmPassword: null,
        }
    }
})

const passwordChecklist = computed(() => {
    const checks = getNewPasswordChecks(userResetPassword.password);
    const strength = messages.error.passwordStrength;
    return [
        { label: strength.hasMinLength, met: checks.minLength },
        { label: strength.mixedCase, met: checks.mixedCase },
        { label: strength.number, met: checks.number },
        { label: strength.specialCharacter, met: checks.specialCharacter },
        { label: strength.noTrailingSpace, met: checks.noTrailingSpace },
    ];
});

const passwordIssueMessage = (issue) => {
    const strength = messages.error.passwordStrength;
    const issueMessages = {
        required: messages.error.form.passwordRequired,
        tooShort: strength.hasMinLength,
        trailingSpace: strength.noTrailingSpace,
        mixedCase: strength.mixedCase,
        number: strength.number,
        specialCharacter: strength.specialCharacter,
    };
    return issueMessages[issue] ?? null;
};

const resetPassword = async () => {
    const passwordIssue = getNewPasswordIssue(userResetPassword.password);
    if (passwordIssue) {
        userResetPassword.controller.errors.password = passwordIssueMessage(passwordIssue);
        return;
    }

    if (!userResetPassword.confirmPassword || userResetPassword.confirmPassword !== userResetPassword.password) {
        userResetPassword.controller.errors.confirmPassword = messages.error.form.confirmPassword;
        return;
    }

    // check reset token password is not empty
    if (!reset_token_password) {
        userResetPassword.controller.isSucces = false;
        userResetPassword.controller.feedback = messages.error.auth.noToken;

        // clear the error message feedback
        setTimeout(() => {
            userResetPassword.controller.isSucces = null;
            userResetPassword.controller.feedback = null;

        }, 4000)

        return;
    }

    userResetPassword.isDisable = true;

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
        if (response.message === 'Password has been reset successfully') {
            userResetPassword.controller.isSucces = true;
            userResetPassword.controller.feedback = messages.success.auth.passwordChanged;

            // clear the error message feedback and redirect to auth page
            setTimeout(() => {
                const route = useRouter();
                route.replace('/auth')

                userResetPassword.isDisable = false;
                userResetPassword.controller.isSucces = false;
                userResetPassword.controller.feedback = null;
            }, 2000);
        }

    } catch (error) {
        userResetPassword.controller.isSucces = false;
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
        const issue = getNewPasswordIssue(password);
        userResetPassword.controller.errors.password = issue && issue !== 'required'
            ? passwordIssueMessage(issue)
            : null;
    }
);

// confirm password watching
watch(
    [() => userResetPassword.password, () => userResetPassword.confirmPassword],
    ([, confirmPassword]) => {
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

onMounted(() => {
    // Move focus to the heading when the sign-in page mounts
    headingRef.value?.focus();
});

// Password toggle State
const showPassword = ref(false);
// Password toggle Function
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
    <section class="flex items-center justify-center min-h-screen md:bg-gradient-to-b"
        aria-labelledby="reset-password-heading">
        <!-- Message Component -->
        <MessageComponent :message="userResetPassword.controller.feedback"
            :position="userResetPassword.controller.feedback ? true : false"
            :event-type="userResetPassword.controller.isSucces ? 'success' : 'error'"
            :icon="userResetPassword.controller.isSucces ? 'icons8:checked' : 'oui:cross-in-circle-empty'" />

        <div class="w-full max-w-md rounded-lg md:bg-white md:shadow-2xl md:pt-3">
            <h1 class="font-bold text-center text-large" id="resete-password-heading" ref="headingRef" tabindex="-1">
                Reset Password
            </h1>
            
            <NuxtLink to="/" class="w-[100px] h-[100px] mx-auto my-6 flex items-center justify-center">
                <NuxtImg src="/logo/logo_tie.gif" class="object-contain w-full h-full"
                    alt="An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text ‘Taasisi ya Elimu Tanzania.’ At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text ‘Elimu ni Kazi." />
            </NuxtLink>
            
            <form @submit.prevent="resetPassword"
                class="px-4 md:min-h-[200px] h-dvh md:h-auto text-textGray overflow-y-auto text-extraSmall">
                <!-- New Password -->
                <div :class="[
                    'flex flex-col items-start justify-between px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                    { 'focus-input-icon-warning focus-within:border-red-500 border-red-500': userResetPassword.controller.errors.password }
                ]">
                    <div class="flex items-center w-full">
                        <input :type="showPassword ? 'text' : 'password'" id="password"
                            v-model="userResetPassword.password" name="password" autocomplete="new-password"
                            aria-describedby="reset-password-requirements reset-password-error"
                            :aria-invalid="!!userResetPassword.controller.errors.password"
                            class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                            placeholder="New Password ">
                        <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                            class="w-5 h-5 cursor-pointer text-textGray" @click="togglePassword" />
                    </div>
                    <ul id="reset-password-requirements" class="w-full space-y-1 text-smallest">
                        <li v-for="item in passwordChecklist" :key="item.label" class="flex items-start gap-2"
                            :class="item.met ? 'text-green-700' : 'text-textGray/70'">
                            <span aria-hidden="true">{{ item.met ? '✓' : '○' }}</span>
                            <span class="sr-only">{{ item.met ? 'Met' : 'Not met' }}:</span>
                            <span>{{ item.label }}</span>
                        </li>
                    </ul>

                    <!-- New Password error message -->
                    <small v-if="userResetPassword.controller.errors.password" id="reset-password-error"
                        class="w-full text-red-500 text-smallest">
                        {{ userResetPassword.controller.errors.password }}
                    </small>
                </div>

                <!-- Confirm Password -->
                <div :class="[
                    'flex flex-col items-start justify-between px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                    { 'focus-input-icon-warning focus-within:border-red-500 border-red-500': userResetPassword.controller.errors.confirmPassword }
                ]">
                    <div class="flex items-center w-full">
                        <input :type="showConfirmPassword ? 'text' : 'password'" id="password"
                            v-model="userResetPassword.confirmPassword" name="password" autocomplete="new-password"
                            class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                            placeholder="Confirm Password ">
                        <Icon :name="showConfirmPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                            class="w-5 h-5 cursor-pointer text-textGray" @click="toggleConfirmPassword" />
                    </div>

                    <!-- New Password error message -->
                    <small v-if="userResetPassword.controller.errors.confirmPassword"
                        class="w-full text-red-500 text-smallest">
                        {{ userResetPassword.controller.errors.confirmPassword }}
                    </small>
                </div>

                <!-- Reset Password Button -->
                <button type="submit" :disabled="userResetPassword.isDisable"
                    class="flex items-center justify-center w-full gap-3 p-2 text-white capitalize transition-all duration-500 rounded-md cursor-pointer bg-oceanBlue disabled:bg-gray-500/40 disabled:cursor-not-allowed hover:bg-oceanBlue/80">
                    {{ userResetPassword.isDisable ? 'Loading...' : userResetPassword.isDisable &&
                        userResetPassword.controller.isSucces ? 'Success' : 'Reset Password' }}
                    <Icon name="eos-icons:loading" class="text-white" size="20" v-if="userResetPassword.isDisable" />

                </button>

            </form>
        </div>
    </section>
</template>
