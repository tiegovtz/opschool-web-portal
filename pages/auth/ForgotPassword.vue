<script setup>
import messages from '~/utilities/messages';
import { auth } from '~/utilities/validationInput';


const userForgotPassword = reactive({
    type: '',
    fname: null,
    lname: null,
    school: null,
    email: null,
    controller: {
        isDisabled: false,
        feedback:null,
        isSucces: false,
        position: false,
        errors: {
            type: '',
            fname: '',
            lname: '',
            school: '',
            email: '',
        }
    }
})

const forgotPassword = async () => {
    // reset error messages first
    userForgotPassword.controller.errors.email = '';
    userForgotPassword.controller.errors.type = '';
    userForgotPassword.controller.errors.fname = '';
    userForgotPassword.controller.errors.lname = '';
    userForgotPassword.controller.errors.school = '';   

    let isValid = true;

    if (!userForgotPassword.email) {
        userForgotPassword.controller.errors.email = messages.error.form.emailRequired;
        isValid = false;
    } else if (!auth.checkEmailPhoneOrUsername(userForgotPassword.email)) {
        userForgotPassword.controller.errors.email = messages.error.form.emailRequired;
        isValid = false;
    }

    if (isValid) {
        // Form is valid, proceed with submission
        userForgotPassword.controller.isDisabled = true;
        // TODO: Implement forgot password logic
        console.log('Forgot password for:', userForgotPassword.email)
    }

    // send data to server
    try {
        const response = await $fetch('/api/auth/forgot-password', {
            method: 'POST',
            body: {
                email: userForgotPassword.email
            }
        });

        if (response?.message) {
                userForgotPassword.controller.feedback = messages.success.auth.checkEmail;
                userForgotPassword.controller.isSucces = true;
            }


            setTimeout(() => {
                userForgotPassword.controller.feedback = null;
                userForgotPassword.controller.isSucces = false;
                userForgotPassword.controller.isDisabled = false;
            }, 3000)
    } catch (error) {
        userForgotPassword.controller.feedback = messages.error.auth.invalidCredentials;
        userForgotPassword.controller.isSucces = false;
        userForgotPassword.controller.isDisabled = false;
        console.error('Error sending forgot password request:', error);
    }
}
</script>

<template>
    <div class="flex items-center justify-center min-h-screen">
        <!-- Message Component -->
        <MessageComponent 
        :message="userForgotPassword.controller.feedback" 
        :position="userForgotPassword.controller.feedback ? true : false"
        :event-type="userForgotPassword.controller.isSucces ? 'success' : 'error'"
        :icon="userForgotPassword.controller.isSucces ? 'icons8:checked' : 'oui:cross-in-circle-empty'" 
        />

        <div class="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
            <h1 class="text-large font-bold text-center">Forgot Password</h1>
            <NuxtImg src="/logo/logo_tie.webp" class="w-20 h-20 mx-auto my-6" alt="logo" />
            <form @submit.prevent="forgotPassword"
                class="px-4 text-textGray md:h-[150px] h-dvh relative overflow-hidden text-extraSmall" 
                :class="[
                    {'md:h-[200px]':userForgotPassword.controller.errors.type},
                    {'md:h-[300px]': userForgotPassword.type.toLowerCase() === 'student'},
                ]">
                <!-- Select User Type -->
                <div class="focus-input-icon mb-2 border-b border-gray-300 focus-within:border-oceanBlue" :class="{
                    'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                        userForgotPassword.controller.errors.type
                }">
                    <div class="flex flex-col w-full items-start">
                        <label for="type" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select User
                            Type:</label>
                        <select name="type" id="type" v-model="userForgotPassword.type"
                            class="w-full p-1 focus:outline-none focus:ring-0"
                            :class="{ 'text-textGray/40': !userForgotPassword.type }">
                            <option value="">(eg: Student, Teacher ...)</option>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Education Stackeholder">Education Stackeholder</option>
                        </select>
                    </div>

                    <!-- Select User Type error message -->
                    <small v-if="userForgotPassword.controller.errors.type" class="text-red-500 text-smallest w-full">
                        {{ userForgotPassword.controller.errors.type }}
                    </small>
                </div>
                <!-- Student -->
                <div v-if="userForgotPassword.type.toLowerCase() === 'student'">
                    <!-- First Name -->
                    <div class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
                        :class="{
                            'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                                userForgotPassword.controller.errors.fname,
                        }">
                        <div class="flex w-full items-center">
                            <input type="text" id="fname" v-model="userForgotPassword.fname" @keydown.space.prevent
                                name="fname" autocomplete="off"
                                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                                placeholder="First Name (eg: Baraka)" />
                            <Icon name="lets-icons:user-box-light" class="h-5 w-5 text-textGray" />
                        </div>

                        <!-- First Name error message -->
                        <small v-if="userForgotPassword.controller.errors.fname"
                            class="text-red-500 text-smallest w-full">
                            {{ userForgotPassword.controller.errors.fname }}
                        </small>
                    </div>

                    <!-- Last Name -->
                    <div class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
                        :class="{
                            'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                                userForgotPassword.controller.errors.lname,
                        }">
                        <div class="flex w-full items-center">
                            <input type="text" id="lname" v-model="userForgotPassword.lname" @keydown.space.prevent
                                name="lname" autocomplete="off"
                                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                                placeholder="Last Name ( eg: Minja )" />
                            <Icon name="lets-icons:user-box-light" class="h-5 w-5 text-textGray" />
                        </div>

                        <!-- Last Name error message -->
                        <small v-if="userForgotPassword.controller.errors.lname"
                            class="text-red-500 text-smallest w-full">
                            {{ userForgotPassword.controller.errors.lname }}
                        </small>
                    </div>

                    <!-- School -->
                    <div class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
                        :class="{
                            'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                                userForgotPassword.controller.errors.school,
                        }">
                        <div class="flex w-full items-center">
                            <input type="text" id="school" v-model="userForgotPassword.school" @keydown.space.prevent
                                name="school" autocomplete="off"
                                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                                placeholder="School ( eg: Taifa Secondary School )" />
                            <Icon name="tdesign:institution" class="h-5 w-5 text-textGray" />
                        </div>

                        <!-- Last Name error message -->
                        <small v-if="userForgotPassword.controller.errors.school"
                            class="text-red-500 text-smallest w-full">
                            {{ userForgotPassword.controller.errors.school }}
                        </small>
                    </div>

                </div>
                <div v-else
                    class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                    <input type="email" id="email" :disabled="userForgotPassword.type.toLowerCase().trim() === ''" v-model="userForgotPassword.email" name="email" autocomplete="off"
                        class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                        placeholder="Email ( eg:example@gmail.com )">
                    <Icon name="mdi-light:email" class="h-5 w-5 text-textGray focus:text-oceanBlue" />
                </div>
                <button type="submit" :disabled="userForgotPassword.controller.isDisabled"
                class="w-full p-2 bg-oceanBlue text-white disabled:bg-gray-500/40 disabled:cursor-not-allowed gap-3 flex items-center justify-center rounded-md cursor-pointer hover:bg-oceanBlue/80 transition-all duration-500 capitalize">
                    Forgot Password
                    <Icon name="eos-icons:loading" class="text-white" size="20" v-if="userForgotPassword.controller.isDisabled" />
                </button>
            </form>
            <div class="mt-4 text-center">
                <p class="text-sm text-textGray">Back to <NuxtLink to="/auth" class="text-oceanBlue cursor-pointer">Sign
                        In</NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>
