<script setup>
// Password toggle State
const showPassword = ref(false);
// Password toggle Function
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
    <div class="flex flex-col items-center justify-center w-full max-w-7xl">
        <!-- Profile Card -->
        <div class="flex flex-col items-center justify-center w-full">
            <div class="relative inline-flex items-center justify-center">
                <!-- Profile Image Container -->
                <div class="overflow-hidden border-4 border-white rounded-full cursor-pointer w-36 h-36">
                    <NuxtImg src="/profile/profile2.jpeg" alt="User Profile"
                        class="object-cover w-full h-full transition-opacity duration-300" />
                </div>

                <!-- Camera Button -->
                <button
                    class="absolute rounded-full bottom-2 right-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Upload new profile picture">
                    <div class="flex items-center justify-center p-2 bg-white rounded-full shadow-md">
                        <Icon name="fluent:camera-add-48-filled" class="w-6 h-6 text-blue-600" />
                    </div>
                </button>
            </div>
            <!-- Profile Name and Type and Gender -->
            <div class="flex flex-col items-center justify-center mt-4">
                <!-- Full Name -->
                <h1 class="font-bold text-large">Baraka George Minja</h1>
                <!-- Type -->
                <h3 class="my-1 text-textGray text-medium">Student</h3>
                <!-- Select Gender -->
                <div class="flex flex-col items-center justify-start md:flex-row md:gap-10">
                    <div class="flex items-center gap-2" id="gender">
                        <!-- Male -->
                        <div class="flex items-center gap-2">
                            <input type="radio" name="gender" id="male" value="male"
                                class="w-4 h-4 checked:bg-deepBlue" />
                            <label for="male" class="text-textGray">Male</label>
                        </div>
                        <!-- Female -->
                        <div class="flex items-center gap-2">
                            <input type="radio" name="gender" id="female" value="female"
                                class="w-4 h-4 checked:bg-deepBlue" />
                            <label for="female" class="text-textGray">Female</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Learning Statistics -->
        <div class="w-full mx-auto my-4 overflow-hidden bg-white rounded-md shadow-md">
            <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
                <h3 class="text-lg font-semibold text-white">Learning Statistics</h3>
            </div>

            <div class="grid w-full grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-6">
                <!-- Topic Opened -->
                <div class="stat-card">
                    <div class="bg-blue-100 stat-icon">
                        <Icon name="ri:book-open-fill" size="20" class="w-6 h-6 text-deepBlue" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Topics Opened</span>
                        <span class="stat-value">9</span>
                    </div>
                </div>

                <!-- Quiz Attempts -->
                <div class="stat-card">
                    <div class="bg-purple-100 stat-icon">
                        <Icon name="solar:notebook-bold" size="20" class="w-6 h-6 text-purple-600" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Quiz Attempts</span>
                        <span class="stat-value">9</span>
                    </div>
                </div>

                <!-- Favorite Subject -->
                <div class="stat-card">
                    <div class="bg-green-100 stat-icon">
                        <Icon name="material-symbols:favorite-rounded" size="20" class="w-6 h-6 text-normalGreener" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Favorite Subject</span>
                        <span class="stat-value">English</span>
                    </div>
                </div>

                <!-- Favorite Topic -->
                <div class="stat-card">
                    <div class="bg-yellow-100 stat-icon">
                        <Icon name="clarity:favorite-solid" size="20" class="w-6 h-6 text-yellow-600" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Favorite Topic</span>
                        <span class="stat-value">0</span>
                    </div>
                </div>

                <!-- Time Spent -->
                <div class="stat-card">
                    <div class="bg-red-100 stat-icon">
                        <Icon name="stash:clock-solid" size="20" class="w-6 h-6 text-red-600" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Time Spent</span>
                        <span class="stat-value">0</span>
                    </div>
                </div>

                <!-- Average Score -->
                <div class="stat-card">
                    <div class="bg-indigo-100 stat-icon">
                        <Icon name="heroicons:chart-bar-16-solid" size="20" class="w-6 h-6 text-indigo-600" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Average Quiz Score</span>
                        <span class="stat-value">51.00%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Personal Information -->
        <div class="w-full mx-auto my-6">
            <div class="overflow-hidden bg-white border border-gray-100 rounded-md shadow-md">
                <!-- Header -->
                <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
                    <h3 class="text-lg font-semibold text-white">Personal Information</h3>
                </div>

                <!-- Form Fields - Modified for full width -->
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
                        <!-- First Name -->
                        <div class="relative group">
                            <label for="fname" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                First Name
                            </label>
                            <div class="relative flex items-center w-full">
                                <span class="absolute flex items-center pointer-events-none left-3">
                                    <Icon name="heroicons:user"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>
                                <input type="text" id="fname" name="fname" autocomplete="off-name"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                                    placeholder="Enter your first name" @keydown.space.prevent />
                            </div>
                        </div>

                        <!-- Last Name -->
                        <div class="relative group">
                            <label for="lname" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                Last Name
                            </label>
                            <div class="relative flex items-center w-full">
                                <span class="absolute flex items-center pointer-events-none left-3">
                                    <Icon name="heroicons:user"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>
                                <input type="text" id="lname" name="lname" autocomplete="off-name"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                                    placeholder="Enter your last name" @keydown.space.prevent />
                            </div>
                        </div>

                        <!-- Email Address -->
                        <div class="relative group">
                            <label for="email" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                Email Address
                            </label>
                            <div class="relative flex items-center w-full">
                                <span class="absolute flex items-center pointer-events-none left-3">
                                    <Icon name="heroicons:envelope"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>
                                <input type="email" id="email" name="username" autocomplete="off"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                                    placeholder="Enter your email address" />
                            </div>
                        </div>

                        <!-- Phone Number -->
                        <div class="relative group">
                            <label for="phone" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                Phone Number
                            </label>
                            <div class="relative flex items-center w-full">
                                <span class="absolute flex items-center pointer-events-none left-3">
                                    <Icon name="heroicons:phone"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>
                                <input type="tel" id="phone" name="phone" autocomplete="off"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                                    placeholder="Enter your phone number" />
                            </div>
                        </div>

                           <!-- Organization -->
                        <div class="relative group">
                            <label for="organization" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                Organization
                            </label>
                            <div class="relative flex items-center w-full">
                                <span class="absolute flex items-center pointer-events-none left-3">
                                    <Icon name="tdesign:institution"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>
                                <input type="text" id="organization" name="organization" autocomplete="off"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                                    placeholder="Organization (eg: Ekima interctive company)" @keydown.space.prevent />
                            </div>
                        </div>

                         <!-- Region -->
                        <div class="relative group">
                            <label for="region" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                Region
                            </label>
                            <div class="relative flex items-center">
                                <!-- Icon first -->
                                <span class="absolute flex items-center left-3">
                                    <Icon name="heroicons:map"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>

                                <!-- Select input with space for the icon -->
                                <select name="region" id="region"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue">
                                    <option value="">(eg: Arusha ...)</option>
                                    <option value="arusha">Arusha</option>
                                    <option value="dar">Dar-es-Salaam</option>
                                    <option value="kilimanjaro">Kilimanjaro</option>
                                </select>
                            </div>
                        </div>

                         <!-- District -->
                        <div class="relative group">
                            <label for="district" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                District
                            </label>
                            <div class="relative flex items-center">
                                <!-- Icon first -->
                                <span class="absolute flex items-center left-3">
                                    <Icon name="heroicons:map"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>

                                <!-- Select input with space for the icon -->
                                <select name="district" id="district"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue">
                                    <option value="">(eg: Arusha Mjini ...)</option>
                                    <option value="arusha">Arusha Mjin</option>
                                    <option value="dar">Iliboru</option>
                                    <option value="kilimanjaro">Olasiti</option>
                                </select>
                            </div>
                        </div>

                         <!-- School -->
                        <div class="relative group">
                            <label for="school" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                School
                            </label>
                            <div class="relative flex items-center">
                                <!-- Icon first -->
                                <span class="absolute flex items-center left-3">
                                    <Icon name="tdesign:institution"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>

                                <!-- Select input with space for the icon -->
                                <select name="school" id="school"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue">
                                    <option value="">(eg: Taifa secondary School ...)</option>
                                    <option value="arusha">Olasiti Secondary School</option>
                                    <option value="dar">Baraa Secondary school</option>
                                    <option value="kilimanjaro">City Boys Secondary School</option>
                                </select>
                            </div>
                        </div>

                            <!-- Password -->
                        <div class="relative group">
                            <label for="password" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                                Password
                            </label>
                            <div class="relative flex items-center w-full">
                                <span class="absolute flex items-center pointer-events-none left-3">
                                     <Icon :name="showPassword
                                        ? 'iconamoon:eye-off-light'
                                        : 'iconamoon:eye-thin'" 
                                        @click="togglePassword"
                                        class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                                </span>
                                <input type="password" id="password" name="password" autocomplete="off"
                                    class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                                    placeholder="Organization (eg: Ekima interctive company)" @keydown.space.prevent />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Submit Button -->
        <div class="flex items-center justify-between w-full gap-4 mt-8">
            <button type="submit"
                class="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium transition-all duration-500 border-2 rounded-md hover:text-white text-deepBlue border-oceanBlue hover:bg-gradient-to-r from-deepBlue to-oceanBlue hover:shadow-md">
                Discard Changes
                <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
            <button type="submit"
                class="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all duration-500 rounded-md bg-gradient-to-r to-oceanBlue from-deepBlue hover:shadow-md">
                Save Changes
                <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
        </div>
    </div>
</template>