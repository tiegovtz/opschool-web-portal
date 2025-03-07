<template>
    <div class="flex items-center justify-center min-h-screen md:container mx-auto py-4">
        <div class="w-full max-w-md px-4 py-10 md:bg-white rounded-lg md:shadow-md">
            <h1 class="text-large font-bold text-center">Sign Up</h1>
            <NuxtImg src="/logo/logo_tie.png" class="w-20 h-20 mx-auto my-6" alt="logo" />
            <form @submit.prevent="signUp"
                class=" text-textGray md:h-[450px] h-dvh relative overflow-hidden text-extraSmall">

                <!-- First Input Group -->
                <div class="flex flex-col absolute -left-150 top-0 px-6 transition-all duration-500"
                    :class="inputTabs === 'tabOne' ? 'left-0 w-full' : ''">
                    <!-- Select User Type -->
                    <div
                        class="focus-input-icon mb-2 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col">
                        <label for="role" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select User
                            Type:</label>
                        <select name="role" id="role" class="w-full p-2 focus:outline-none focus:ring-0">
                            <option value="">Eg: Student, Teacher ...</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="reasearcher">Researcher</option>
                            <option value="education_stackeholder">Education Stackeholder</option>
                        </select>
                    </div>
                    <!-- Full Name -->
                    <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                        <input type="text" id="fname" v-model="fname" name="fname" autocomplete="off"
                            class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                            placeholder="Full Name (eg: Baraka Minja)">
                        <Icon name="lets-icons:user-box-light" class="h-5 w-5 text-textGray" />
                    </div>
                    <!-- Username -->
                    <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                        <input type="text" id="username" v-model="username" name="username" autocomplete="off"
                            class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                            placeholder="username ( eg: baraka )">
                        <Icon name="solar:user-outline" class="h-5 w-5 text-textGray" />
                    </div>
                    <!-- Email -->
                    <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                        <input type="text" id="email" v-model="email" name="email" autocomplete="off"
                            class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                            placeholder="Email (eg: example@gmail.com)">
                        <Icon name="mdi-light:email" class="h-5 w-5 text-textGray" />
                    </div>

                    <!-- Phone Number -->
                    <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                        <input type="tel" id="phone" v-model="phone" name="phone" autocomplete="off"
                            class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                            placeholder="Phone Number">
                        <Icon name="iconamoon:phone-thin" class="h-5 w-5 text-textGray" />
                    </div>

                    <!-- select Gender -->
                    <!-- <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col">
                        <label for="gender" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select
                            Gender:</label>
                        <select name="gender" id="gender" class="w-full p-2 focus:outline-none focus:ring-0">
                            <option value=""></option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div> -->

                    <!-- gender input radio -->
                    <div
                        class="flex items-center justify-start md:flex-row flex-col md:gap-10 mb-4 border-b border-gray-300 focus-within:border-oceanBlue py-2">
                        <label for="gender" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select
                            Gender:</label>
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-2">
                                <input type="radio" name="gender" id="male" value="male" class="w-4 h-4 checked:bg-oceanBlue">
                                <label for="male">Male</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="radio" name="gender" id="female" value="female" class="w-4 h-4 checked:bg-oceanBlue">
                                <label for="female">Female</label>
                            </div>
                        </div>
                    </div>

                    <!-- Next Button -->
                    <div class="flex items-center justify-center px-2">
                        <button type="button" @click="switchTab('tabTwo')"
                            class="rounded-full h-8 w-auto px-4 gap-2 hover:bg-oceanBlue hover:text-white text-oceanBlue border border-oceanBlue animate-bounce-horizontal cursor-pointer transition-all duration-500 flex items-center group">
                            <p class="text-small group-hover:text-white">Next</p>
                            <Icon name="f7:arrow-right" class="group-hover:text-white" size="16" />
                        </button>
                    </div>

                    <!-- Already have an account -->
                    <div class="mt-4 flex items-center justify-center gap-2">
                        <p class="text-sm text-textGray">Already have an account?
                            <NuxtLink to="/auth" class="w-full p-2 text-center cursor-pointer text-oceanBlue">
                                Sign In</NuxtLink>
                        </p>
                    </div>

                </div>

                <!-- Second Input Group -->
                <div class="flex flex-col absolute -right-150 top-0 px-6 transition-all duration-500"
                    :class="inputTabs === 'tabTwo' ? 'right-0 w-full h-full' : ''">
                    <!-- Select Age -->
                    <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col">
                        <label for="age" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select
                            Age:</label>
                        <select name="age" id="age" class="w-full p-2 focus:outline-none focus:ring-0">
                            <option value="">Eg: kids(3 - 12) ...</option>
                            <option value="3-12">Kids(3 - 12)</option>
                            <option value="13-19">Teens(13 - 19)</option>
                            <option value="20-60">Young Adults(20 - 35)</option>
                            <option value="60+">Middle-Aged Adults(36 - 60)</option>
                        </select>
                    </div>
                    <!-- Select Region -->
                    <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col">
                        <label for="region" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select
                            Region:</label>
                        <select name="region" id="region" class="w-full p-2 focus:outline-none focus:ring-0">
                            <option value="">Eg: Arusha ...</option>
                            <option value="arusha">Arusha</option>
                            <option value="dar_es_salaam">Dar es Salaam</option>
                            <option value="dodoma">Dodoma</option>
                            <option value="geita">Geita</option>
                            <option value="iringa">Iringa</option>
                            <option value="kagera">Kagera</option>
                            <option value="katavi">Katavi</option>
                            <option value="kigoma">Kigoma</option>
                            <option value="kilimanjaro">Kilimanjaro</option>
                            <option value="lindi">Lindi</option>
                            <option value="manyara">Manyara</option>
                            <option value="mara">Mara</option>
                            <option value="mbeya">Mbeya</option>
                            <option value="mjini_magharibi">Mjini Magharibi</option>
                            <option value="morogoro">Morogoro</option>
                            <option value="mtwara">Mtwara</option>
                            <option value="mwanza">Mwanza</option>
                            <option value="njombe">Njombe</option>
                            <option value="pemba_north">Pemba North</option>
                            <option value="pemba_south">Pemba South</option>
                            <option value="pwani">Pwani</option>
                            <option value="rukwa">Rukwa</option>
                            <option value="ruvuma">Ruvuma</option>
                            <option value="shinyanga">Shinyanga</option>
                            <option value="simiyu">Simiyu</option>
                            <option value="singida">Singida</option>
                            <option value="songwe">Songwe</option>
                            <option value="tabora">Tabora</option>
                            <option value="tanga">Tanga</option>
                            <option value="unguja_north">Unguja North</option>
                            <option value="unguja_south">Unguja South</option>
                        </select>
                    </div>
                    <!-- Password -->
                    <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                        <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password"
                            name="password" autocomplete="off"
                            class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                            placeholder="Password">
                        <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                            class="h-5 w-5 cursor-pointer text-textGray" @click="togglePassword" />
                    </div>
                    <!-- Confirm Password -->
                    <div
                        class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex items-center gap-2">
                        <input :type="showConfirmPassword ? 'text' : 'password'" id="confirm_password"
                            v-model="confirm_password" name="confirm_password" autocomplete="off"
                            class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray placeholder:text-xs"
                            placeholder="Confirm Password">
                        <Icon :name="showConfirmPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                            class="h-5 w-5 cursor-pointer text-textGray" @click="toggleConfirmPassword" />
                    </div>

                    <!-- Sign Up Button -->
                    <button type="submit"
                        class="w-full p-2 bg-oceanBlue text-white rounded-md cursor-pointer hover:bg-oceanBlue/80 transition-all duration-500">Sign
                        Up</button>

                    <!-- Already have an account -->
                    <div class="mt-4 flex items-center justify-center gap-2 mb-10">
                        <p class="text-sm text-textGray">Already have an account?
                            <NuxtLink to="/auth" class="w-full p-2 text-center cursor-pointer text-oceanBlue">
                                Sign In</NuxtLink>
                        </p>
                    </div>

                    <!-- Previous Button -->
                    <div class="flex items-center justify-center px-2">
                        <button type="button" @click="switchTab('tabOne')"
                            class="rounded-full h-8 w-auto px-4 gap-2 hover:bg-oceanBlue hover:text-white text-oceanBlue border border-oceanBlue animate-bounce-horizontal cursor-pointer transition-all duration-500 flex items-center group">
                            <Icon name="f7:arrow-left" class="group-hover:text-white" size="16" />
                            <p class="text-small group-hover:text-white">Back</p>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
const signUp = () => {
    console.log('signUp')
}
// Password toggle
const showPassword = ref(false)
const togglePassword = () => {
    showPassword.value = !showPassword.value
}
// Confirm Password toggle
const showConfirmPassword = ref(false)
const toggleConfirmPassword = () => {
    showConfirmPassword.value = !showConfirmPassword.value
}
// input tabs control
const inputTabs = ref('tabOne')
// input tabs control

const switchTab = (tabName) => {
    inputTabs.value = tabName
}


</script>