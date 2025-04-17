<script setup>
import messages from "~/utilities/messages";
import { MessageComponent, ProfileDrawInitialLater } from "#components";

// Define Cookie
const userToken = useCookie("signInUserToken").value;

// Define One State
const profile = reactive({
  fname: userToken.name.split(" ")[0],
  lname: userToken.name.split(" ")[1],
  email: userToken.email,
  phone: userToken.phoneNumber,
  organization: userToken.organization,
  region: userToken.region?.toLowerCase(),
  district:
    userToken.district == null || userToken.district == undefined
      ? ""
      : userToken.district.toString().toLowerCase(),
  school:
    userToken.school == null || userToken.school == undefined
      ? ""
      : userToken.school.toString().toLowerCase(),
  level: userToken.level,
  type: userToken.type,
  profilePic: userToken.profilePic,
  controller: {
    status: "",
    errors: {
      all: null,
      type: "",
      fname: null,
      lname: null,
      userName: null,
      email: null,
      phone: null,
      gender: null,
      age: null,
      region: null,
      password: null,
      confirm_password: null,
      school: null,
      district: null,
      organization: null,
      userOrgRole: null,
      otherRole: null,
      profilePic: null,
    },
  },
});

// Define Three State
const isModified = ref(false);

// Define Two State
const data = reactive({
  regions: [],
  district: [],
  schools: [],
  status: "idle",
  error: null,
});

// Fetch Region function
const fetchRegion = async () => {
  data.error = null;

  try {
    const response = await $fetch(
      `https://apitie.ekima.africa/v1/schools/regions`
    );

    data.status = "success";
    data.regions = response;
  } catch (err) {
    data.status = "error";
    data.error = err.message;
  }
};

// Fetch district function
const fetchDistricts = async (region) => {
  data.status = "pending";
  data.error = null;

  try {
    const response = await $fetch(
      `https://apitie.ekima.africa/v1/schools/districts/${String(
        region
      ).toUpperCase()}`
    );

    data.status = "success";
    data.district = response;
  } catch (err) {
    data.status = "error";
    data.error = err.message;
  }
};

// Fetch schools function
const fetchSchools = async (region, district) => {
  data.status = "pending";
  data.error = null;
  if (!region || !district || region === "" || district === "") {
    data.status = "idle";
    return;
  }

  try {
    const response = await $fetch("https://apitie.ekima.africa/v1/schools", {
      method: "POST",
      body: {
        region: `${region}`.toUpperCase(),
        district: `${district}`.toUpperCase(),
      },
    });

    data.status = "success";
    data.schools = response;
  } catch (err) {
    data.status = "error";
    data.error = err.message;
  }
};

// Initial fetch
fetchRegion();
fetchDistricts(profile.region);
fetchSchools(profile.region, profile.district);

// Watch for changes in region or district (School)
watch(
  () => profile.district,
  (district) => {
    if (district) {
      fetchSchools(profile.region, district);
    }
  }
);

watch(
  () => profile.region,
  (region) => {
    if (region) {
      fetchSchools(region, profile.district);
      // Watch for changes in region or district (School)
      fetchDistricts(region);
    }
  }
);

// Watch Profile
watch(
  () => profile,
  (newChanges) => {
    if (newChanges) {
      isModified.value = !isModified.value;
    } else {
      isModified.value = !isModified.value;
    }
  }
);

const onValueChanged = (inputName) => {
  if (inputName == "fname" && profile.fname != userToken.name.split(" ")[0]) {
    isModified.value = true;
    profile.controller.errors.fname = messages.error.form.firstName;
  } else if (
    inputName == "lname" &&
    profile.lname != userToken.name.split(" ")[1]
  ) {
    isModified.value = true;
    profile.controller.errors.lname = messages.error.form.lastName;
  } else if (inputName == "email" && profile.email != userToken.email) {
    isModified.value = true;
    profile.controller.errors.email = messages.error.form.email;
  } else if (inputName == "phone" && profile.phone != userToken.phoneNumber) {
    isModified.value = true;
    profile.controller.errors.phone = messages.error.validation.invalidPhone;
  } else if (
    inputName == "organization" &&
    profile.organization != userToken.organization
  ) {
    isModified.value = true;
    profile.controller.errors.organization = "Please enter your organization";
  } else if (inputName == "level" && profile.level != userToken.level) {
    isModified.value = true;
    profile.controller.errors.level = "Please enter your level";
  } else if (
    inputName == "profilePic" &&
    profile.profilePic != userToken.profilePic
  ) {
    isModified.value = true;

    // profile.controller.errors.profilePic = "Please enter your Profile";
  } else {
    isModified.value = false;
  }
};

const choosePict = (event) => {
  const file = event.target.files?.[0];

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!file) return;
  
  setTimeout(() => {
    profile.controller.errors.profilePic = null;
    profile.controller.status = false;
  }, 4000)
  
  if (!allowedTypes.includes(file.type)) {
    profile.controller.errors.profilePic =
      "Only JPG, PNG, or WEBP images are allowed.";
    profile.controller.status = false;
    return;
  }

  if (file.size > maxSize) {
    profile.controller.errors.profilePic = "File size must be under 2MB.";
    profile.controller.status = false;
    return;
  }

  profile.profilePic = URL.createObjectURL(file);
  profile.controller.errors.profilePic = "Profile updated";
  profile.controller.status = true;
  onValueChanged("profilePic");

};
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full max-w-7xl">
    <!-- Message Component -->
    <MessageComponent
      :message="profile.controller.errors.profilePic"
      :position="profile.controller.errors.profilePic ? true : false"
      :event-type="profile.controller.status ? 'success' : 'error'"
      :icon="
        profile.controller.status
          ? 'icons8:checked'
          : 'oui:cross-in-circle-empty'
      "
    />

    <!-- Profile Card -->
    <div class="flex flex-col items-center justify-center w-full">
      <div class="relative inline-flex items-center justify-center">
        <!-- Profile Image Container -->
        <div
          class="relative overflow-hidden transition-all duration-500 ease-in-out rounded-full cursor-pointer w-36 h-36 group"
        >
          <!-- Profile Image -->
          <NuxtImg
            :src="
              profile.profilePic && profile.profilePic.trim() !== ''
                ? profile.profilePic
                : '/profile/profile2.jpeg'
            "
            alt="User Profile"
            class="object-cover w-full h-full transition-all duration-500 ease-in-out transform group-hover:scale-110 group-hover:opacity-10"
          />

          <!-- Overlay with Initials -->
          <ProfileDrawInitialLater
            class="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100"
          />
        </div>

        <!-- Camera Button -->
        <label
          for="picture_input"
          class="absolute rounded-full bottom-2 right-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-oceanBlue"
          aria-label="Upload new profile picture"
        >
          <div
            class="flex items-center justify-center p-2 bg-white rounded-full shadow-md"
          >
            <Icon
              name="fluent:camera-add-48-filled"
              class="w-6 h-6 text-deepBlue"
            />
          </div>
        </label>
        <input
          type="file"
          id="picture_input"
          @change="choosePict"
          class="hidden"
          accept="image/*"
          style="display: none"
          hidden
        />
      </div>
      <!-- Profile Name and Type -->
      <div class="flex flex-col items-center justify-center mt-4">
        <!-- Full Name -->
        <h1 class="font-bold text-large">{{ userToken.name }}</h1>
        <!-- Type -->
        <h3 class="my-1 text-textGray text-medium">{{ userToken.type }}</h3>
      </div>
    </div>

    <!-- Learning Statistics -->
    <div
      class="w-full mx-auto my-4 overflow-hidden bg-white rounded-md shadow-md"
    >
      <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
        <h3 class="text-lg font-semibold text-white">Learning Statistics</h3>
      </div>

      <div
        class="grid w-full grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-5"
      >
        <!-- Topic Opened -->
        <div class="stat-card">
          <div class="bg-blue-100 stat-icon">
            <Icon
              name="fa6-solid:book-open-reader"
              size="20"
              class="w-6 h-6 text-deepBlue"
            />
          </div>
          <div class="stat-content">
            <span class="stat-label">Topics Opened</span>
            <span class="stat-value">9</span>
          </div>
        </div>

        <!-- Favorite Subject -->
        <div class="stat-card">
          <div class="bg-green-100 stat-icon">
            <Icon
              name="material-symbols:favorite-rounded"
              size="20"
              class="w-6 h-6 text-normalGreener"
            />
          </div>
          <div class="stat-content">
            <span class="stat-label">Most Viewed Subject</span>
            <span class="stat-value">English</span>
          </div>
        </div>

        <!-- Time Spent -->
        <div class="stat-card">
          <div class="bg-red-100 stat-icon">
            <Icon
              name="stash:clock-solid"
              size="20"
              class="w-6 h-6 text-red-600"
            />
          </div>
          <div class="stat-content">
            <span class="stat-label">Time Spent</span>
            <span class="stat-value">0</span>
          </div>
        </div>

        <!-- Quiz Attempts -->
        <div class="stat-card">
          <div class="bg-purple-100 stat-icon">
            <Icon
              name="solar:notebook-bold"
              size="20"
              class="w-6 h-6 text-purple-600"
            />
          </div>
          <div class="stat-content">
            <span class="stat-label">Quiz Attempts</span>
            <span class="stat-value">9</span>
          </div>
        </div>

        <!-- Average Score -->
        <div class="stat-card">
          <div class="bg-indigo-100 stat-icon">
            <Icon
              name="heroicons:chart-bar-16-solid"
              size="20"
              class="w-6 h-6 text-indigo-600"
            />
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
      <div
        class="overflow-hidden bg-white border border-gray-100 rounded-md shadow-md"
      >
        <!-- Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
          <h3 class="text-lg font-semibold text-white">Personal Information</h3>
        </div>

        <!-- Form Fields - Modified for full width -->
        <div class="p-6">
          <div
            class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5"
          >
            <!-- First Name -->
            <div class="relative group">
              <label
                for="fname"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                First Name
              </label>
              <div class="relative flex items-center w-full">
                <span
                  class="absolute flex items-center pointer-events-none left-3"
                >
                  <Icon
                    name="heroicons:user"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>
                <input
                  type="text"
                  id="fname"
                  name="fname"
                  autocomplete="off-name"
                  @input="onValueChanged('fname')"
                  v-model="profile.fname"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  placeholder="Enter your first name"
                  @keydown.space.prevent
                />
              </div>
            </div>

            <!-- Last Name -->
            <div class="relative group">
              <label
                for="lname"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                Last Name
              </label>
              <div class="relative flex items-center w-full">
                <span
                  class="absolute flex items-center pointer-events-none left-3"
                >
                  <Icon
                    name="heroicons:user"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>
                <input
                  type="text"
                  id="lname"
                  name="lname"
                  autocomplete="off-name"
                  @input="onValueChanged('lname')"
                  v-model="profile.lname"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  placeholder="Enter your last name"
                  @keydown.space.prevent
                />
              </div>
            </div>

            <!-- Email Address -->
            <div
              class="relative group"
              v-if="profile.type.toLowerCase() !== 'student'"
            >
              <label
                for="email"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                Email Address
              </label>
              <div class="relative flex items-center w-full">
                <span
                  class="absolute flex items-center pointer-events-none left-3"
                >
                  <Icon
                    name="heroicons:envelope"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>
                <input
                  type="email"
                  id="email"
                  name="username"
                  autocomplete="off"
                  @input="onValueChanged('email')"
                  v-model="profile.email"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <!-- Phone Number -->
            <div
              class="relative group"
              v-if="profile.type.toLowerCase() !== 'student'"
            >
              <label
                for="phone"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                Phone Number
              </label>
              <div class="relative flex items-center w-full">
                <span
                  class="absolute flex items-center pointer-events-none left-3"
                >
                  <Icon
                    name="heroicons:phone"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>

                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  autocomplete="off"
                  v-model="profile.phone"
                  @input="onValueChanged('phone')"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <!-- Organization -->
            <div
              class="relative group"
              v-if="profile.type.toLowerCase() !== 'student'"
            >
              <label
                for="organization"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                Organization
              </label>
              <div class="relative flex items-center w-full">
                <span
                  class="absolute flex items-center pointer-events-none left-3"
                >
                  <Icon
                    name="tdesign:institution"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  autocomplete="off"
                  @input="onValueChanged('organization')"
                  v-model="profile.organization"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  placeholder="Organization (eg: Ekima interctive company)"
                  @keydown.space.prevent
                />
              </div>
            </div>

            <!-- Region -->
            <div class="relative group">
              <label
                for="region"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                Region
              </label>
              <div class="relative flex items-center">
                <!-- Icon first -->
                <span class="absolute flex items-center left-3">
                  <Icon
                    name="heroicons:map"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>

                <!-- Select input with space for the icon -->
                <select
                  name="region"
                  id="region"
                  v-model="profile.region"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                >
                  <option value="" v-if="data.status === 'pending'">
                    Loading...
                  </option>
                  <option value="" v-else-if="data.status === 'error'">
                    {{ data.error }}
                  </option>
                  <option
                    value=""
                    v-else-if="data.regions && data.status === 'success'"
                  >
                    Eg ( Arusha ) ...
                  </option>
                  <option
                    v-for="(region, index) in data.regions"
                    :key="index"
                    :value="region.toLowerCase()"
                  >
                    {{
                      `${region}`.charAt(0).toUpperCase() +
                      `${region}`.slice(1).toLowerCase()
                    }}
                  </option>
                </select>
              </div>
            </div>

            <!-- District -->
            <div class="relative group">
              <label
                for="district"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                District
              </label>
              <div class="relative flex items-center">
                <!-- Icon first -->
                <span class="absolute flex items-center left-3">
                  <Icon
                    name="heroicons:map"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>

                <!-- Select input with space for the icon -->
                <select
                  name="district"
                  id="district"
                  v-model="profile.district"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                >
                  <option value="" v-if="data.status === 'idle'">
                    Select Region First
                  </option>
                  <option value="" v-if="data.status === 'pending'">
                    Loading...
                  </option>
                  <option value="" v-if="data.status === 'error'">
                    {{ data.error }}
                  </option>
                  <option
                    value=""
                    v-else-if="data.district && data.status === 'success'"
                  >
                    Eg (Arusha CC) ...
                  </option>
                  <option
                    v-for="(district, index) in data.district"
                    :key="index"
                    :value="district.toLowerCase()"
                  >
                    {{
                      `${district}`.charAt(0).toUpperCase() +
                      `${district}`.slice(1).toLowerCase()
                    }}
                  </option>
                </select>
              </div>
            </div>

            <!-- School -->
            <div class="relative group">
              <label
                for="school"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                School
              </label>
              <div class="relative flex items-center">
                <!-- Icon first -->
                <span class="absolute flex items-center left-3">
                  <Icon
                    name="tdesign:institution"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>

                <!-- Select input with space for the icon -->
                <select
                  name="school"
                  id="school"
                  v-model="profile.school"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                >
                  <option value="" v-if="data.status === 'idle'">
                    Select Region and District First
                  </option>
                  <option value="" v-if="data.status === 'pending'">
                    Loading...
                  </option>
                  <option value="" v-if="data.status === 'error'">
                    {{ data.error }}
                  </option>
                  <option
                    value=""
                    v-else-if="data.schools && data.status === 'success'"
                  >
                    Eg (Taifa Secondary School) ...
                  </option>
                  <option
                    v-for="school in data.schools"
                    :key="school._id"
                    :value="school._id"
                  >
                    {{
                      school.name
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(" ")
                    }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <div
      class="flex items-center justify-between w-full gap-4 mt-8"
      v-if="isModified"
    >
      <button
        type="submit"
        @click="isModified = false"
        class="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium transition-colors duration-500 ease-in-out border-2 rounded-md hover:text-white text-deepBlue border-oceanBlue hover:bg-gradient-to-r from-deepBlue to-oceanBlue hover:shadow-md"
      >
        Discard Changes
        <Icon name="heroicons:arrow-right" class="w-4 h-4" />
      </button>
      <button
        type="submit"
        @click="isModified = false"
        class="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all duration-500 rounded-md bg-gradient-to-r to-oceanBlue from-deepBlue hover:shadow-md"
      >
        Save Changes
        <Icon name="heroicons:arrow-right" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>


   <!-- Learning Subject Statistics -->
    <!-- <div class="w-full mx-auto my-4 overflow-hidden bg-white rounded-md shadow-md">
            <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
                <h3 class="text-lg font-semibold text-white">Learning Topics Statistics</h3>
            </div>
            <div class="grid w-full grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-5">
                <div class="stat-card">
                    <div class="w-10 h-10 overflow-hidden rounded-full">
                        <NuxtImg src="/images/physics.jpeg" alt="physics" class="object-cover w-full h-full" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Introduction to physics</span>
                        <span class="stat-value">51.00%</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="w-10 h-10 overflow-hidden rounded-full">
                        <NuxtImg src="/images/physics.jpeg" alt="physics" class="object-cover w-full h-full" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Measurement</span>
                        <span class="stat-value">20.00%</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="w-10 h-10 overflow-hidden rounded-full">
                        <NuxtImg src="/images/physics.jpeg" alt="physics" class="object-cover w-full h-full" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Introduction to Force</span>
                        <span class="stat-value">34.00%</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="w-10 h-10 overflow-hidden rounded-full">
                        <NuxtImg src="/images/physics.jpeg" alt="physics" class="object-cover w-full h-full" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Sinking and Float</span>
                        <span class="stat-value">43.00%</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="w-10 h-10 overflow-hidden rounded-full">
                        <NuxtImg src="/images/physics.jpeg" alt="physics" class="object-cover w-full h-full" />
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Pressure</span>
                        <span class="stat-value">29.00%</span>
                    </div>
                </div>
            </div>
        </div> -->
