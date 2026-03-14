<script setup lang="ts">
import messages from "~/utilities/messages";
import { MessageComponent, ProfileDrawInitialLater } from "#components";
import apiDocs from "~/utilities/apiDocs";
import type { Level } from "~/types/level.interface";
import { FetchError } from "ofetch";

// Defien Status
type Status = "idle" | "pending" | "loading" | "success" | "error";

// Define Cookie
const signInAccessToken = useCookie<string>("signInAccessToken");
const userToken = useCookie<any>("signInUserToken");
let uploadedPic;

interface UserProfile {
  fname: string,
  lname: string,
  email: string,
  phone: string,
  organization: string,
  region: string,
  district: string,
  school: string,
  level: string,
  type: string,
  profilePic: string,
  controller: {
    status: Status,
    feedback: string,
    errors: {
      all: null | string,
      type: string,
      fname: null | string,
      lname: null | string,
      userName: null | string,
      email: null | string,
      phone: null | string,
      gender: null | string,
      age: null | string,
      region: null | string,
      password: null | string,
      confirm_password: null | string,
      school: null | string,
      district: null | string,
      organization: null | string,
      userOrgRole: null | string,
      otherRole: null | string,
      profilePic: null | string,
      level: null | string,
    },
  },
}

// Define State
const listLevel = ref<Level[]>([]);
const isModified = ref<Boolean>(false);

const profile = reactive<UserProfile>({
  fname: userToken.value.name.split(" ")[0],
  lname: userToken.value.name.split(" ")[1],
  email: userToken.value.email,
  phone: userToken.value.phoneNumber,
  organization: userToken.value.organization,
  region: userToken.value.region?.toLowerCase(),
  district:
    userToken.value.district == null || userToken.value.district == undefined
      ? ""
      : userToken.value.district.toString().toLowerCase(),
  school:
    userToken.value.school == null || userToken.value.school == undefined
      ? ""
      : userToken.value.school.toString().toLowerCase(),
  level: userToken.value.level?._id || "",
  type: userToken.value.type,
  profilePic: userToken.value.profilePic,
  controller: {
    status: "idle",
    feedback: '',
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
      level: null,
    },
  },
});

// Define Two State
const data = reactive<{ regions: any[], district: any[], schools: any[], status: Status, error: any, }>({
  regions: [],
  district: [],
  schools: [],
  status: "idle",
  error: null,
});

// List 
const levelsLists = computed(() =>
  (listLevel.value ?? []).map((level) => ({ id: level._id, name: level.name }))
)

const schoolOptions = computed(() =>
  (data.schools ?? []).map((school) => ({ id: school._id, name: school.name }))
)

const districtOptions = computed(() =>
  (data.district ?? []).map((district) => ({ id: district.toLowerCase(), name: district }))
)

const regionOptions = computed(() =>
  (data.regions ?? []).map((region) => ({ id: region.toLowerCase(), name: region }))
)

// Region, District and School Placeholders
const regionPlaceholder = computed(() => {
  if (data.status === "idle") return "Select Region";
  if (data.status === "pending") return "Loading...";
  if (data.status === "error") return data.error ?? "An error occurred.";
  if (data.regions && data.status === "success") return "Eg (Mwanza) ...";
  return "Select Region";
});

const schoolPlaceholder = computed(() => {
  if (data.status === "idle") return "Select Region and District First";
  if (data.status === "pending") return "Loading...";
  if (data.status === "error") return data.error ?? "An error occurred.";
  if (data.schools && data.status === "success") return "Eg (Taifa Secondary School) ...";
  return "Select School";
});

const districtPlaceholder = computed(() => {
  if (data.status === "idle") return "Select Region First";
  if (data.status === "pending") return "Loading...";
  if (data.status === "error") return data.error ?? "An error occurred.";
  if (data.district && data.status === "success") return "Eg (Mwanza) ...";
  return "Select District";
});

// Define Update Function
const updatedProfile = async () => {
  profile.controller.status = "loading";
  isModified.value = true;
  try {
    const response = await $fetch(apiDocs.auth.profileEdit, {
      method: "PATCH",
      body: {
        name: profile.fname + " " + profile.lname,
        email: profile.email,
        phoneNumber: profile.phone,
        organization: profile.organization,
        region: profile.region,
        district: profile.district,
        school: profile.school,
        level: profile.level,
        type: profile.type,
      },

      headers: {
        Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
      },
    });


    if (response) {
      // Only update values if remote is valid (non-empty)
      for (const key in response) {
        if (Object.prototype.hasOwnProperty.call(response, key)) {
          const remoteValue = (response as any)[key];
          if (remoteValue !== undefined && remoteValue !== null && remoteValue !== "") {
            (profile as any)[key] = remoteValue;
            (userToken.value as any)[key] = remoteValue;
          }
        }
      }
    }

    isModified.value = false;
    profile.controller.status = "success";
    profile.controller.feedback = "Profile updated successfully!";

  } catch (error: any) {
    isModified.value = false;
    profile.controller.status = "error";
    profile.controller.feedback = "Failed to update profile.";
    const fetchError = error as FetchError;
    const status = fetchError?.response?.status;
    const message = fetchError?.data?.message || fetchError?.message || "An error occurred while updating the profile.";
    console.error(error, { status: status, message: message });
  }
};

// Fetch Profile Data
const { data: profileData, status, error } = await useFetch<any>(apiDocs.auth.profile, {
  headers: {
    Authorization: `Bearer ${signInAccessToken.value}`
  }
});

const getLevel = async () => {
  try {
    const response = await $fetch<Level[]>(apiDocs.levels.getLevels, {
      method: "GET",
    });
    listLevel.value = response;
  } catch (error) {
    console.error("Error fetching levels:", error);
  }
};

// Fetch Region function
const fetchRegion = async () => {
  data.error = null;

  try {
    const response = await $fetch<any[]>(
      apiDocs.school.getSchoolRegions
    );

    data.status = "success";
    data.regions = response;
  } catch (err) {
    data.status = "error";
    data.error = (err as any).message;
  }
};

// Fetch district function
const fetchDistricts = async (region: string) => {
  data.status = "pending";
  data.error = null;

  try {
    const response = await $fetch<any[]>(
      apiDocs.school.getSchoolDistricts(region.toUpperCase())
    );

    data.status = "success";
    data.district = response;
  } catch (err) {
    data.status = "error";
    data.error = (err as any).message;
  }
};

// Fetch schools function
const fetchSchools = async (region: string, district: string) => {
  data.status = "pending";
  data.error = null;
  if (!region || !district || region === "" || district === "") {
    data.status = "idle";
    return;
  }

  try {
    const response = await $fetch<any[]>(apiDocs.school.get, {
      query: {
        region: region.toUpperCase(),
        district: district.toUpperCase(),
      }
    });

    data.status = "success";
    data.schools = response;

  } catch (err) {
    data.status = "error";
    data.error = (err as any).message;
  }
};

// On Mounted
onMounted(async () => {
  await getLevel();
  await fetchRegion();
  await fetchDistricts(profile.region);
  await fetchSchools(profile.region, profile.district);
})

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

const onValueChanged = (inputName: string) => {
  if (inputName == "fname" && profile.fname != userToken.value.name.split(" ")[0] && profile.fname.trim() !== "") {
    isModified.value = true;
    profile.controller.errors.fname = messages.error.form.firstName;
  } else if (
    inputName == "lname" &&
    profile.lname != userToken.value.name.split(" ")[1] && profile.lname.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.lname = messages.error.form.lastName;
  } else if (inputName == "email" && profile.email != userToken.value.email && profile.email.trim() !== "") {
    isModified.value = true;
    profile.controller.errors.email = messages.error.form.emailRequired;
  } else if (inputName == "phone" && profile.phone != userToken.value.phoneNumber && profile.phone.trim() !== "") {
    isModified.value = true;
    profile.controller.errors.phone = messages.error.validation.invalidPhone;
  } else if (
    inputName == "organization" &&
    profile.organization != userToken.value.organization && profile.organization.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.organization = "Please enter your organization";
  } else if (inputName == "level" && profile.level != userToken.value.level && profile.level.trim() !== "") {
    isModified.value = true;
    profile.controller.errors.level = "Please enter your level";
  } else if (
    inputName == "profilePic" &&
    profile.profilePic != userToken.value.profilePic && profile.profilePic.trim() !== ""
  ) {
    isModified.value = true;
  }
  else if (
    inputName == "region" &&
    profile.region != userToken.value.region && profile.region.trim() !== ""
  ) {
    isModified.value = true;
  }
  else if (
    inputName == "district" &&
    profile.district != userToken.value.district && profile.district.trim() !== ""
  ) {
    isModified.value = true;
  }
  else if (
    inputName == "school" &&
    profile.school != userToken.value.school && profile.school.trim() !== ""
  ) {
    isModified.value = true;
  }
  else {
    isModified.value = false;
  }
};

const choosePict = async (event: Event) => {
  if (!event.target) return;
  const file = (event.target as HTMLInputElement).files?.[0];

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!file) return;

  setTimeout(() => {
    profile.controller.errors.profilePic = null;
    profile.controller.status = 'idle';
  }, 1500)

  if (!allowedTypes.includes(file.type)) {
    profile.controller.errors.profilePic =
      "Only JPG, PNG, or WEBP images are allowed.";
    profile.controller.status = 'error';
    return;
  }

  if (file.size > maxSize) {
    profile.controller.errors.profilePic = "File size must be under 2MB.";
    profile.controller.status = 'error';
    return;
  }

  uploadedPic = file;
  profile.profilePic = URL.createObjectURL(file);

  // Update profile picture in server
  const formData = new FormData();
  formData.append("profilePic", file);

  await $fetch(apiDocs.auth.profilePicture, {
    method: "PATCH",
    body: formData,
    headers: {
      Authorization: `Bearer ${signInAccessToken.value}`,
    },
  }).then((response) => {
    if (response) {
      // profile.profilePic = response;
      profile.controller.status = 'success';
      profile.controller.feedback = 'profile picture updated successfully';
    }
  }).catch((error) => {
    profile.controller.status = 'error';
    profile.controller.feedback = error.message;
  });
};

// Define  Discard Changes Button
const discardChanges = () => {
  profile.fname = userToken.value.name.split(" ")[0];
  profile.lname = userToken.value.name.split(" ")[1];
  profile.email = userToken.value.email;
  profile.phone = userToken.value.phoneNumber;
  profile.organization = userToken.value.organization;
  profile.region = userToken.value.region?.toLowerCase();
  profile.district = userToken.value.district == null || userToken.value.district == undefined
    ? ""
    : userToken.value.district.toString().toLowerCase();
  profile.school =
    userToken.value.school == null || userToken.value.school == undefined
      ? ""
      : userToken.value.school.toString().toLowerCase();
  profile.level = userToken.value.level;
  profile.type = userToken.value.type;
  profile.profilePic = userToken.value.profilePic;
  isModified.value = false;

}

</script>

<template>
  <div v-if="status == 'pending'" class="flex items-center justify-center w-full max-w-7xl'">
    <LoadingIndicator :is-loading="true" />
  </div>

  <div v-else-if="status == 'success'" class="flex flex-col items-center justify-center w-full max-w-7xl">
    <!-- Message Component -->
    <MessageComponent :message="profile.controller.errors.profilePic as string"
      :position="profile.controller.errors.profilePic ? true : false"
      :event-type="profile.controller.status ? 'success' : 'error'" :icon="profile.controller.status
        ? 'icons8:checked'
        : 'oui:cross-in-circle-empty'
        " />

    <!-- Profile Card -->
    <div class="flex flex-col items-center justify-center w-full">
      <div class="relative inline-flex items-center justify-center">
        <!-- Profile Image Container -->
        <div
          class="relative overflow-hidden transition-all duration-500 ease-in-out rounded-full cursor-pointer w-36 h-36 group">
          <!-- Profile Image -->
          <NuxtImg :src="profile.profilePic && profile.profilePic.trim() !== ''
            ? uploadedPic ? profile.profilePic : apiDocs.baseURL.replace('v1', '') + profile.profilePic
            : '/profile/profile2.jpeg'
            " alt="User Profile"
            class="object-cover w-full h-full transition-all duration-500 ease-in-out transform group-hover:scale-110 group-hover:opacity-10" />

          <!-- Overlay with Initials -->
          <ProfileDrawInitialLater
            class="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100" />
        </div>

        <!-- Camera Button -->
        <label for="picture_input"
          class="absolute rounded-full bottom-2 right-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-oceanBlue"
          aria-label="Upload new profile picture">
          <div class="flex items-center justify-center p-2 bg-white rounded-full shadow-md">
            <IconsCamera :size="24" class="text-deepBlue" />
          </div>
        </label>
        <input type="file" id="picture_input" @change="choosePict" class="hidden" accept="image/*" style="display: none"
          hidden />
      </div>
      <!-- Profile Name and Type -->
      <div class="flex flex-col items-center justify-center mt-4">
        <!-- Full Name -->
        <h1 class="font-bold text-large">{{ userToken?.name }}</h1>
        <!-- Type -->
        <h3 class="my-1 text-textGray text-medium">{{ userToken?.type }}</h3>
      </div>
    </div>

    <!-- Learning Statistics -->
    <div class="w-full mx-auto my-4 overflow-hidden bg-white rounded-xl shadow-lg border border-slate-100">
      <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
        <h3 class="text-lg font-semibold text-white">Learning Statistics</h3>
      </div>
      <div class="grid w-full grid-cols-2 gap-3 p-4 sm:p-5 md:grid-cols-3 xl:grid-cols-5">
        <!-- Competences Opened -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-blue-100 text-deepBlue">
            <Icon name="heroicons:book-open-20-solid" class="w-6 h-6" />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Competences Opened</span>
            <span class="profile-stat-value">{{ profileData?.totalTopicsOpened ?? 0 }}</span>
          </div>
        </div>
        <!-- Subject Opened -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-emerald-100 text-emerald-700">
            <Icon name="heroicons:academic-cap-20-solid" class="w-6 h-6" />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Subject Opened</span>
            <span class="profile-stat-value">{{ profileData?.openedSubjects ?? 0 }}</span>
          </div>
        </div>
        <!-- Time Spent -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-amber-100 text-amber-700">
            <Icon name="heroicons:clock-20-solid" class="w-6 h-6" />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Time Spent</span>
            <span class="profile-stat-value">{{ profileData?.timeSpentFormatted ?? '0h 0m' }}</span>
          </div>
        </div>
        <!-- Quiz Attempts -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-violet-100 text-violet-600">
            <Icon name="heroicons:clipboard-document-list-20-solid" class="w-6 h-6" />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Quiz Attempts</span>
            <span class="profile-stat-value">{{ profileData?.questionStats?.totalAttempted != null ? Number(profileData.questionStats.totalAttempted).toFixed(0) : '0' }}</span>
          </div>
        </div>
        <!-- Average Quiz Score -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-indigo-100 text-indigo-600">
            <Icon name="heroicons:chart-bar-20-solid" class="w-6 h-6" />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Average Quiz Score</span>
            <span class="profile-stat-value">{{ profileData?.questionStats?.averageScore != null ? Number(profileData.questionStats.averageScore).toFixed(1) : '—' }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Learning Subject Statistics -->
    <div class="w-full mx-auto my-4 overflow-hidden bg-white rounded-md shadow-md"
      v-if="profileData?.recentTopics?.length > 0">
      <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
        <h3 class="text-lg font-semibold text-white">Learning Topics Statistics</h3>
      </div>
      <div class="grid w-full grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-5">
        <HomeTopicCard v-for="topic in profileData.recentTopics" :key="topic?._id" :topic-id="topic?._id"
          :topic-image="topic?.thumbnail" :topic-title="topic?.name" :topic-description="topic?.descriptions"
          :topic-duration="topic?.topic_duration ? topic?.topic_duration : '10 min'"
          :topic-likes="topic?.topic_likes ? topic?.topic_likes : 100"
          :topic-views="topic?.viewedBy?.length ? topic?.viewedBy?.length : topic?.views ? topic?.views : 0"
          topic-level="lower secondary" :topic-standard="topic?.level?.name" :subject-name="topic?.subject?.name"
          :topic-viewed="topic?.isViewed" :topic-progress="topic?.progress?.avgProgress" model-type="profile" />
      </div>
    </div>

    <!-- Personal Information -->
    <div class="w-full mx-auto my-6">
      <div class="bg-white border border-gray-100 rounded-md shadow-md">
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
                <input type="text" id="fname" name="fname" autocomplete="off-name" @input="onValueChanged('fname')"
                  v-model="profile.fname"
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
                <input type="text" id="lname" name="lname" autocomplete="off-name" @input="onValueChanged('lname')"
                  v-model="profile.lname"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  placeholder="Enter your last name" @keydown.space.prevent />
              </div>
            </div>

            <!-- Email Address -->
            <div class="relative group" v-if="profile.type.toLowerCase() !== 'student'">
              <label for="email" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                Email Address
              </label>
              <div class="relative flex items-center w-full">
                <span class="absolute flex items-center pointer-events-none left-3">
                  <Icon name="heroicons:envelope"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                </span>
                <input type="email" id="email" name="username" autocomplete="off" @input="onValueChanged('email')"
                  v-model="profile.email"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  placeholder="Enter your email address" />
              </div>
            </div>

            <!-- Phone Number -->
            <div class="relative group" v-if="profile.type.toLowerCase() !== 'student'">
              <label for="phone" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                Phone Number
              </label>
              <div class="relative flex items-center w-full">
                <span class="absolute flex items-center pointer-events-none left-3">
                  <Icon name="heroicons:phone"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                </span>

                <input type="tel" id="phone" name="phone" autocomplete="off" v-model="profile.phone"
                  @input="onValueChanged('phone')"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  placeholder="Enter your phone number" />
              </div>
            </div>

            <!-- Organization -->
            <div class="relative group" v-if="profile.type.toLowerCase() !== 'student'">
              <label for="organization" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                Organization
              </label>
              <div class="relative flex items-center w-full">
                <span class="absolute flex items-center pointer-events-none left-3">
                  <Icon name="tdesign:institution"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                </span>
                <input type="text" id="organization" name="organization" autocomplete="off"
                  @input="onValueChanged('organization')" v-model="profile.organization"
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

                <CustomDropDownList id="region" name="region" v-model="profile.region" :list="regionOptions"
                  :placeholder="regionPlaceholder"
                  @update-model-value="(value: string) => { profile.region = value; onValueChanged('region'); }"
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue" />
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

                <CustomDropDownList id="district" name="district" v-model="profile.district" :list="districtOptions"
                  :placeholder="districtPlaceholder"
                  @update-model-value="(value: string) => { profile.district = value; onValueChanged('district'); }"
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue" />
              </div>
            </div>

            <!-- School -->
            <div class="relative group" v-if="profile.type.toLowerCase() !== 'educationstakeholder'">
              <label for="school" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                School
              </label>

              <div class="relative flex items-center">
                <!-- Icon first -->
                <span class="absolute flex items-center left-3">
                  <Icon name="tdesign:institution"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue" />
                </span>

                <CustomDropDownList id="school" name="school" v-model="profile.school" :list="schoolOptions"
                  :placeholder="schoolPlaceholder"
                  @update-model-value="(value: string) => { profile.school = value; onValueChanged('school'); }"
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue" />
              </div>
            </div>

            <div class="relative group"
              v-if="!['teacher', 'educationstakeholder'].includes(profile.type.toLowerCase())">
              <label for="level" class="block mb-1 ml-1 text-xs font-medium text-textGray">
                Level
              </label>

              <div class="relative flex items-center">
                <!-- Use the Custom Dropdown instead of <select> -->
                <CustomDropDownList v-model="profile.level" :list="levelsLists" placeholder="(eg: Form 1, Form 2 ...)"
                  @update-model-value="(value: string) => { profile.level = value; onValueChanged('level'); }"
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <Transition name="fade">
      <div class="flex items-center justify-between w-full gap-4 mt-8" v-if="isModified">
        <!-- Discard Changes -->
        <button type="reset" @click="discardChanges"
          class="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium transition-colors duration-500 ease-in-out border-2 rounded-md hover:text-white text-deepBlue border-oceanBlue hover:bg-gradient-to-r from-deepBlue to-oceanBlue hover:shadow-md">
          Discard Changes
          <Icon name="heroicons:arrow-right" class="w-4 h-4" />
        </button>

        <!-- save Changes -->
        <button type="submit" @click="updatedProfile()"
          :disabled="profile.controller.status === 'loading' || isModified == false"
          :aria-busy="profile.controller.status === 'loading' ? 'true' : 'false'" :class="[
            'flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all duration-500 rounded-md bg-gradient-to-r to-oceanBlue from-deepBlue hover:shadow-md',
            profile.controller.status === 'loading' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
            profile.controller.status === 'success' ? 'bg-green-500 cursor-not-allowed' : 'cursor-pointer',
            profile.controller.feedback === 'error' ? 'bg-red-500 cursor-not-allowed' : 'cursor-pointer'
          ]">
          <div class="flex items-center justify-center gap-4" v-if="profile.controller.status === 'loading'">
            <span>Please Wait...</span>
            <IconsLoading class="text-white" :size="20" />
          </div>

          <div class="flex items-center justify-center gap-4" v-else-if="profile.controller.status === 'success'">
            <span>Changes Saved Successfully!</span>
            <IconsChecked class="text-white" :size="20" />
          </div>

          <div class="flex items-center justify-center gap-4" v-else-if="profile.controller.feedback === 'error'">
            <span>Changes Failed to Save!</span>
            <IconsCrossCircle class="text-white" :size="20" />
          </div>

          <div class="flex items-center justify-center gap-4" v-else>
            Save Changes
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </div>
        </button>
      </div>

    </Transition>
  </div>
  <div v-else-if="status == 'error'" class="flex items-center justify-center w-full max-w-7xl'">
    <MessagePageNotFound />
  </div>
  <div v-else class="flex items-center justify-center w-full max-w-7xl'">
    <p class="text-center text-medium">
      Try to refresh the page, Something went Wrong
    </p>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
  will-change: opacity, transform;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.profile-stat-card {
  @apply flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 transition-colors hover:bg-slate-100/80;
}

.profile-stat-icon {
  @apply flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0;
}

.profile-stat-content {
  @apply flex flex-col items-center sm:items-start min-w-0;
}

.profile-stat-label {
  @apply text-xs font-medium text-slate-500 leading-tight;
}

.profile-stat-value {
  @apply text-base font-bold text-slate-800 mt-0.5 tabular-nums;
}
</style>
