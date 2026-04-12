<script setup>
import messages from '~/utilities/messages';
import { auth } from '~/utilities/validationInput';
import { CustomDropDownList } from "#components";
import apiDocs from "~/utilities/apiDocs";


const userForgotPassword = reactive({
    type: '',
    fname: null,
    lname: null,
    school: null,
    email: null,
    controller: {
        isDisabled: false,
        feedback: null,
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
    }

    const schoolName = userForgotPassword.school.toLowerCase();
    const cutoffIndexes = [
        schoolName.indexOf('secondary'),
        schoolName.indexOf('sekondari')
    ].filter(i => i !== -1); // remove not found

    const cutoff = cutoffIndexes.length > 0 ? Math.min(...cutoffIndexes) : schoolName.length;

    const school = userForgotPassword.school.substring(0, cutoff).trim();

    // send data to server
    try {
        const response = await $fetch(userForgotPassword.type.toLowerCase().trim() == 'student' ?
            apiDocs.auth.forgotPasswordStudent :
            '/api/auth/forgot-password',
            {
                method: 'POST',
                body: userForgotPassword.type.toLowerCase().trim() == 'student' ?
                    {
                        name: userForgotPassword.fname + ' ' + userForgotPassword.lname,
                        school: school,
                    } :

                    {
                        email: userForgotPassword.email
                    }
            });

        if (userForgotPassword.type.toLowerCase().trim() == 'student') {
            userForgotPassword.controller.isSucces = true;
            const route = useRouter();
            userForgotPassword.controller.feedback = messages.success.auth.studentPasswordChanged;
            setTimeout(() => {
                route.replace(`/auth/reset-password?token=${response?.token}`)
                userForgotPassword.controller.feedback = null;
            }, 3000)

        } else {
            if (response?.message) {
                userForgotPassword.controller.feedback = messages.success.auth.checkEmail;
                userForgotPassword.controller.isSucces = true;
            }
        }
        // clear all error message feedback
        setTimeout(() => {
            userForgotPassword.controller.feedback = null;
            userForgotPassword.controller.isSucces = false;
            userForgotPassword.controller.isDisabled = false;
        }, 1000)
    } catch (error) {
        userForgotPassword.controller.feedback = messages.error.auth.invalidCredentials;
        userForgotPassword.controller.isSucces = false;
        userForgotPassword.controller.isDisabled = false;
        console.error('Error sending forgot password request:', error);
    }
};

const userTypes = [
    { id: 'Student', name: 'Student' },
    { id: 'other', name: 'Teacher or Education Stakeholder' },
];
</script>

<template>
    <section class="flex items-center justify-center min-h-screen md:bg-gradient-to-b">
        <!-- Message Component -->
        <MessageComponent :message="userForgotPassword.controller.feedback"
            :position="userForgotPassword.controller.feedback ? true : false"
            :event-type="userForgotPassword.controller.isSucces ? 'success' : 'error'"
            :icon="userForgotPassword.controller.isSucces ? 'icons8:checked' : 'oui:cross-in-circle-empty'" />

        <div class="w-full max-w-md px-4 rounded-lg md:bg-white md:shadow-2xl md:pt-3">
            <h1 class="font-bold text-center text-large">Forgot Password</h1>
            <NuxtLink to="/" class="w-[100px] h-[100px] mx-auto my-6 flex items-center justify-center">
                <NuxtImg src="/logo/logo_tie.gif" class="object-contain w-full h-full"
                    alt="An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text ‘Taasisi ya Elimu Tanzania.’ At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text ‘Elimu ni Kazi." />
            </NuxtLink>
            <form @submit.prevent="forgotPassword" :class="[
                'px-4 text-textGray md:h-[150px] relative text-extraSmall',
                { 'md:h-[200px]': userForgotPassword.controller.errors.type },
                { 'md:h-[300px]': userForgotPassword.type.toLowerCase() === 'student' },
            ]">
                <!-- Select User Type -->
                <div :class="[
                    'mb-2 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                    {
                        'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                            userForgotPassword.controller.errors.type
                    }
                ]">
                    <div class="flex flex-col items-start w-full">
                        <label for="type" class="font-semibold capitalize text-oceanBlue text-extraSmall">
                            Select User Type:</label>

                        <!-- Use the Custom Dropdown instead of <select> -->
                        <CustomDropDownList v-model="userForgotPassword.type" :list="userTypes"
                            placeholder="(eg: Student, Teacher ...)"
                            :aria-invalid="!!userForgotPassword.controller.errors.type" aria-describedby="type-error"
                            @update-model-value="userForgotPassword.type = $event" />

                    </div>

                    <!-- Select User Type error message -->
                    <small id="type-error" v-if="userForgotPassword.controller.errors.type"
                        class="w-full text-red-500 text-smallest">
                        {{ userForgotPassword.controller.errors.type }}
                    </small>
                </div>

                <!-- Student -->
                <div v-if="userForgotPassword.type.toLowerCase() === 'student'">
                    <!-- First Name -->
                    <div :class="[
                        'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                        {
                            'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                                userForgotPassword.controller.errors.fname,
                        }
                    ]">
                        <label for="fname" class="sr-only">First Name</label>
                        <div class="flex items-center w-full">
                            <input type="text" id="fname" v-model="userForgotPassword.fname" @keydown.space.prevent
                                name="fname" autocomplete="off"
                                :aria-invalid="!!userForgotPassword.controller.errors.fname"
                                aria-describedby="fname-error"
                                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                                placeholder="First Name" />
                            <Icon name="lets-icons:user-box-light" class="w-5 h-5 text-textGray" />
                        </div>

                        <!-- First Name error message -->
                        <small id="fname-error" v-if="userForgotPassword.controller.errors.fname"
                            class="w-full text-red-500 text-smallest">
                            {{ userForgotPassword.controller.errors.fname }}
                        </small>
                    </div>

                    <!-- Last Name -->
                    <div :class="[
                        'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                        {
                            'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                                userForgotPassword.controller.errors.lname,
                        }
                    ]">
                        <label for="lname" class="sr-only">Last Name</label>
                        <div class="flex items-center w-full">
                            <input type="text" id="lname" v-model="userForgotPassword.lname" @keydown.space.prevent
                                name="lname" autocomplete="off"
                                :aria-invalid="!!userForgotPassword.controller.errors.lname"
                                aria-describedby="lname-error"
                                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                                placeholder="Last Name" />
                            <Icon name="lets-icons:user-box-light" class="w-5 h-5 text-textGray" />
                        </div>

                        <!-- Last Name error message -->
                        <small id="lname-error" v-if="userForgotPassword.controller.errors.lname"
                            class="w-full text-red-500 text-smallest">
                            {{ userForgotPassword.controller.errors.lname }}
                        </small>
                    </div>

                    <!-- School -->
                    <div :class="[
                        'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                        {
                            'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                                userForgotPassword.controller.errors.school,
                        }
                    ]">
                        <label for="school" class="sr-only">School Name</label>
                        <div class="flex items-center w-full">
                            <input type="text" id="school" v-model="userForgotPassword.school" name="school"
                                autocomplete="off" :aria-invalid="!!userForgotPassword.controller.errors.school"
                                aria-describedby="school-error"
                                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                                placeholder="School ( eg: Taifa Secondary School )" />
                            <Icon name="tdesign:institution" class="w-5 h-5 text-textGray" />
                        </div>

                        <!-- School error message -->
                        <small id="school-error" v-if="userForgotPassword.controller.errors.school"
                            class="w-full text-red-500 text-smallest">
                            {{ userForgotPassword.controller.errors.school }}
                        </small>
                    </div>

                </div>
                <div v-else class="flex flex-col">
                    <div
                        class="flex items-center gap-2 mb-2 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue">
                        <label for="email" class="sr-only">Email Address</label>
                        <input type="email" id="email" :disabled="userForgotPassword.type.toLowerCase().trim() === ''"
                            v-model="userForgotPassword.email" name="email" autocomplete="off"
                            :aria-invalid="!!userForgotPassword.controller.errors.email" aria-describedby="email-error"
                            class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                            placeholder="Email ( eg:example@email.com )">
                        <Icon name="mdi-light:email" class="w-5 h-5 text-textGray focus:text-oceanBlue" />
                    </div>
                    <!-- Email error message -->
                    <small id="email-error" v-if="userForgotPassword.controller.errors.email"
                        class="w-full mb-4 text-red-500 text-smallest">
                        {{ userForgotPassword.controller.errors.email }}
                    </small>
                </div>
                <button type="submit" :disabled="userForgotPassword.controller.isDisabled"
                    class="flex items-center justify-center w-full gap-3 p-2 text-white capitalize transition-all duration-500 rounded-md cursor-pointer bg-oceanBlue disabled:bg-gray-500/40 disabled:cursor-not-allowed hover:bg-oceanBlue/80">
                    Forgot Password
                    <Icon name="eos-icons:loading" class="text-white" size="20"
                        v-if="userForgotPassword.controller.isDisabled" />
                </button>
            </form>
            <div class="my-4 text-center">
                <p class="text-sm text-textGray">Back to
                    <NuxtLink to="/auth" class="cursor-pointer text-oceanBlue">Sign In</NuxtLink>
                </p>
            </div>
        </div>
    </section>
</template>
