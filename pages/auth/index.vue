<script setup>
import messages from '~/utilities/messages';
import { auth } from '~/utilities/validationInput';
import apiDocs from '~/utilities/api-docs';
import { sanitize } from "~/utilities/sanitizeInput";
import axios from 'axios'


const path = useState('topicToView')
// User Sign In Function
const userSignIn = reactive({
    type: "",
    status: "idle",
    username: null,
    password: null,
    rememberMe: false,
    controller: {
        isSubmitted: false,
        isSucces: false,
        feedback: null,
        attemps: 0,
        errors: {
            username: '',
            password: '',
            type: "",
        }
    }
});

// Sign In Function
const signIn = async () => {
    // Reset error messages first
    userSignIn.controller.errors.username = '';
    userSignIn.controller.errors.password = '';

    let isValid = true;

    // Check for empty fields first
    if (!userSignIn.username) {
        userSignIn.controller.errors.username = messages.error.form.usernameRequired;
        isValid = false;
    } else if (!auth.checkEmailOrPhoneNumber(userSignIn.username)) {
        userSignIn.controller.errors.username = messages.error.form.usernameValid;
        isValid = false;
    }

    if (!userSignIn.password) {
        userSignIn.controller.errors.password = messages.error.form.passwordRequired;
        isValid = false;
    }

    if (isValid) {
        // Form is valid, proceed with submission
        isDisable.value = true;
        if (userSignIn.controller.attemps == 3) {
            return
        }

        // send data
        try {
            const response = await axios.post(apiDocs.auth.login, {
                username: sanitize.input(userSignIn.username),
                password: userSignIn.password,
            })

            if (response.status >= 200 && response.status < 300) {
                userSignIn.controller.feedback = messages.success.auth.authenticated;

                // unlock button
                isDisable.value = false;

                userSignIn.controller.feedback = messages.success.auth.authenticated;
                userSignIn.controller.isSucces = true;

                const accessToken = useCookie('signInAccessToken')
                const refreshToken = useCookie('signInRefreshToken')
                const userToken = useCookie('signInUserToken', {
                    default: () => ({}),

                    // This is important for objects - automatic serialization/deserialization
                    encode: (value) => JSON.stringify(value),
                    decode: (value) => JSON.parse(value)
                })

                accessToken.value = response.data.access_token
                refreshToken.value = response.data.refresh_token
                userToken.value = response.data.user

                setTimeout(() => {
                    // router
                    const router = useRouter();

                    if (path.value) {
                        // Clears history and navigates to the new page 
                        router.replace(path.value);
                    } else {
                        router.replace('/home');
                    }
                }, 3000)


            } else {
                userSignIn.controller.attemps++;
                isDisable.value = false
                userSignIn.controller.feedback = messages.error.auth.invalidCredentials;

            }
        } catch (error) {
            userSignIn.controller.attemps++;
            userSignIn.controller.feedback = messages.error.auth.invalidCredentials;
            isDisable.value = false
        }

        setTimeout(() => {
            userSignIn.controller.feedback = null;
            userSignIn.controller.isSucces = false;
        }, 2000)

    }
};

// Disable Variable
const isDisable = ref(false);

// Password toggle
const showPassword = ref(false);
const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

// Clear validation errors when user types
watch(() => userSignIn.username, (username) => {
    if (username) {
        if (auth.checkEmailOrPhoneNumber(username)) {
            userSignIn.controller.errors.username = '';
        } else {
            userSignIn.controller.errors.username = messages.error.form.usernameValid;
        }
    } else {
        userSignIn.controller.errors.username = null;
    }
});

watch(() => userSignIn.password, (password) => {
    if (password) {
        userSignIn.controller.errors.password = '';
    } else {
        userSignIn.controller.errors.password = null;
    }
});
</script>

<template>
    <div class="flex items-center justify-center min-h-screen md:bg-gradient-to-b">


        <MessageComponent :message="userSignIn.controller.feedback" :position="userSignIn.controller.feedback"
            :event-type="userSignIn.controller.isSucces ? 'success' : 'error'"
            :icon="userSignIn.controller.isSucces ? 'icons8:checked' : 'oui:cross-in-circle-empty'" />

        <div class="w-full max-w-md px-4 md:bg-white rounded-lg md:shadow-2xl md:pt-3">
            <h1 class="text-large font-bold text-center">Welcome</h1>
            <NuxtLink to="/">
                <NuxtImg src="/logo/logo_tie.webp" class="w-20 h-20 mx-auto my-6" alt="logo" />
            </NuxtLink>
            <form @submit.prevent="signIn" v-if="userSignIn.controller.attemps < 3"
            class="px-4 text-textGray md:h-[400px] h-dvh relative overflow-hidden text-extraSmall" 
            :class="{'md:h-[450px]': userSignIn.controller.errors.type}">
                <!-- Select User Type -->
                <div class="focus-input-icon mb-2 border-b border-gray-300 focus-within:border-oceanBlue" 
                :class="{'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                        userSignIn.controller.errors.type}">
                    <div class="flex flex-col w-full items-start">
                        <label for="type" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select User
                            Type:</label>
                        <select name="type" id="type" v-model="userSignIn.type"
                            class="w-full p-1 focus:outline-none focus:ring-0"
                            :class="{ 'text-textGray/40': !userSignIn.type }">
                            <option value="">(eg: Student, Teacher ...)</option>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Education Stackeholder">Education Stackeholder</option>
                        </select>
                    </div>

                    <!-- Select User Type error message -->
                    <small v-if="userSignIn.controller.errors.type" class="text-red-500 text-smallest w-full">
                        {{ userSignIn.controller.errors.type }}
                    </small>
                </div>

                <!-- Username Teacher and Stackeholder and Student -->
                    <div 
                    class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
                    :class="{ 'focus-input-icon-warning focus-within:border-red-500 border-red-500': userSignIn.controller.errors.username }">
                    <div class="flex w-full items-center">
                        <!-- idle -->
                         <div class="text-red-500 text-xs flex items-center flex-1 py-2 mt-2" v-if="userSignIn.type.trim() === ''">
                            Please select user type First
                         </div>
                         
                         <!-- student -->
                        <input type="text" v-else-if="userSignIn.type.trim().toLowerCase() === 'student'"
                        class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                        placeholder="Username (e.g. Baraka.Minja)">
                        <input type="text" id="username" v-model="userSignIn.username" name="username" v-else
                            autocomplete="off" @keydown.space.prevent
                            class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                            placeholder="Username (e.g. example@gmail.com or 0622 *** 722)">
                        <Icon name="ph:student-thin" class="h-5 w-5 text-textGray" v-if="userSignIn.type.trim().toLowerCase() === 'student'" />
                        <Icon name="ant-design:select-outlined" class="h-5 w-5 text-textGray" v-else-if="userSignIn.type.trim().toLowerCase() === ''" />
                        <Icon name="solar:user-outline" class="h-5 w-5 text-textGray" v-else />

                    </div>

                    <!-- Username error message -->
                    <small v-if="userSignIn.controller.errors.username" 
                    class="text-red-500 text-smallest w-full"
                    :class="[
                        {'mt-1': userSignIn.type.trim().toLowerCase() === 'student'},
                        {'mt-1': userSignIn.type.trim().toLowerCase() === 'teacher' || 
                        userSignIn.type.trim().toLowerCase() === 'education stackeholder'},
                        {'mt-0': userSignIn.type.trim().toLowerCase() === ''},
                    ]">
                        {{ userSignIn.controller.errors.username }}
                    </small>
                </div>

                <!-- Password -->
                <div class="focus-input-icon px-2 mb-4 flex flex-col items-start justify-between border-b border-gray-300 focus-within:border-oceanBlue"
                    :class="{ 'focus-input-icon-warning focus-within:border-red-500 border-red-500': userSignIn.controller.errors.password }">
                    <div class="flex w-full items-center">
                        <input :type="showPassword ? 'text' : 'password'" id="password" v-model="userSignIn.password"
                            name="password"
                            class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                            placeholder="Password">
                        <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                            class="h-5 w-5 cursor-pointer text-textGray" @click="togglePassword" />
                    </div>

                    <!-- Password error message -->
                    <small v-if="userSignIn.controller.errors.password" class="text-red-500 text-smallest w-full">
                        {{ userSignIn.controller.errors.password }}
                    </small>
                </div>

                <div class="my-6 flex items-center justify-between">
                    <NuxtLink to="/auth/ForgotPassword" class="text-sm text-textGray cursor-pointer">
                        Forgot Password?
                    </NuxtLink>
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="remember" v-model="userSignIn.rememberMe"
                            class="w-4 h-4 cursor-pointer">
                        <label for="remember" class="text-sm text-textGray cursor-pointer">
                            Remember me
                        </label>
                    </div>
                </div>

                <button type="submit" :disabled="isDisable"
                    class="w-full p-2 bg-oceanBlue text-white disabled:bg-gray-500/40 disabled:cursor-not-allowed gap-3 flex items-center justify-center rounded-md cursor-pointer hover:bg-oceanBlue/80 transition-all duration-500 capitalize">
                    Sign In
                    <Icon name="eos-icons:loading" class="text-white" size="20" v-if="isDisable" />
                </button>

                <!-- sign up -->
                <div class="my-4 flex flex-col items-center gap-4">
                    <p class="text-sm text-textGray">Don't have an account?</p>
                    <NuxtLink to="/auth/SignUp"
                        class="w-full p-2 text-center cursor-pointer bg-darkBlue text-white rounded-md hover:bg-darkBlue/80 transition-all duration-500 capitalize">
                        Sign Up
                    </NuxtLink>
                </div>
            </form>
            <div v-else class="flex flex-col gap-2 w-full items-center justify-center">
                <div class="py-3">
                    You have attempted to sign in <span class="text-oceanBlue">{{ userSignIn.controller.attemps
                    }}</span> times.
                    Please consider to
                </div>
                <NuxtLink to="/auth/ForgotPassword"
                    class="bg-oceanBlue cursor-pointer w-full flex justify-center items-center rounded-md text-white p-2 capitalize">
                    reset
                    your
                    password
                </NuxtLink>
                or
                <NuxtLink to="/auth/SignUp"
                    class="bg-oceanBlue cursor-pointer w-full flex justify-center items-center rounded-md text-white p-2 mb-3 capitalize">
                    Register a
                    new account.
                </NuxtLink>
            </div>
        </div>
    </div>
</template>