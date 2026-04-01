<script setup lang="ts">
import messages from "~/utilities/messages";
import { MessageComponent, ProfileDrawInitialLater } from "#components";
import apiDocs from "~/utilities/apiDocs";
import type { Level } from "~/types/level.interface";
import { FetchError } from "ofetch";

type Status = "idle" | "pending" | "loading" | "success" | "error";

const signInAccessToken = useCookie<string>("signInAccessToken");
const userToken = useCookie<any>("signInUserToken");
const pageLanguage = useHubPageLanguage();
const isSw = computed(() => pageLanguage.value === "kiswahili");
let uploadedPic: File | null = null;

interface UserProfile {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  organization: string;
  region: string;
  district: string;
  school: string;
  level: string;
  type: string;
  profilePic: string;
  controller: {
    status: Status;
    feedback: string;
    errors: {
      all: null | string;
      type: string;
      fname: null | string;
      lname: null | string;
      userName: null | string;
      email: null | string;
      phone: null | string;
      gender: null | string;
      age: null | string;
      region: null | string;
      password: null | string;
      confirm_password: null | string;
      school: null | string;
      district: null | string;
      organization: null | string;
      userOrgRole: null | string;
      otherRole: null | string;
      profilePic: null | string;
      level: null | string;
    };
  };
}

const getNameParts = () => {
  const [fname = "", lname = ""] = String(userToken.value?.name ?? "")
    .trim()
    .split(/\s+/, 2);

  return { fname, lname };
};

const createProfileState = (): UserProfile => {
  const { fname, lname } = getNameParts();

  return {
    fname,
    lname,
    email: userToken.value?.email ?? "",
    phone: userToken.value?.phoneNumber ?? "",
    organization: userToken.value?.organization ?? "",
    region: userToken.value?.region?.toLowerCase?.() ?? "",
    district:
      userToken.value?.district == null
        ? ""
        : String(userToken.value.district).toLowerCase(),
    school:
      userToken.value?.school == null
        ? ""
        : String(userToken.value.school).toLowerCase(),
    level: userToken.value?.level?._id ?? userToken.value?.level ?? "",
    type: userToken.value?.type ?? "",
    profilePic: userToken.value?.profilePic ?? "",
    controller: {
      status: "idle",
      feedback: "",
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
  };
};

const listLevel = ref<Level[]>([]);
const isModified = ref<Boolean>(false);
const profile = reactive<UserProfile>(createProfileState());

const data = reactive<{
  regions: any[];
  district: any[];
  schools: any[];
  status: Status;
  error: any;
}>({
  regions: [],
  district: [],
  schools: [],
  status: "idle",
  error: null,
});

const levelsLists = computed(() =>
  (listLevel.value ?? []).map((level) => ({ id: level._id, name: level.name })),
);

const schoolOptions = computed(() =>
  (data.schools ?? []).map((school) => ({ id: school._id, name: school.name })),
);

const districtOptions = computed(() =>
  (data.district ?? []).map((district) => ({
    id: district.toLowerCase(),
    name: district,
  })),
);

const regionOptions = computed(() =>
  (data.regions ?? []).map((region) => ({
    id: region.toLowerCase(),
    name: region,
  })),
);

const profileText = computed(() => ({
  profile: isSw.value ? "Wasifu" : "Profile",
  personalDetails: isSw.value ? "Taarifa Binafsi" : "Personal Details",
  manageAccount: isSw.value
    ? "Simamia taarifa za akaunti yako hapa. Takwimu za ujifunzaji sasa zipo kwenye ukurasa wake."
    : "Manage your account information here. Learning statistics now has its own page.",
  openLearningStatistics: isSw.value
    ? "Fungua Takwimu za Ujifunzaji"
    : "Open Learning Statistics",
  personalInformation: isSw.value ? "Taarifa Binafsi" : "Personal Information",
  firstName: isSw.value ? "Jina la Kwanza" : "First Name",
  lastName: isSw.value ? "Jina la Mwisho" : "Last Name",
  emailAddress: isSw.value ? "Barua Pepe" : "Email Address",
  phoneNumber: isSw.value ? "Namba ya Simu" : "Phone Number",
  organization: isSw.value ? "Taasisi" : "Organization",
  region: isSw.value ? "Mkoa" : "Region",
  district: isSw.value ? "Wilaya" : "District",
  school: isSw.value ? "Shule" : "School",
  level: isSw.value ? "Ngazi" : "Level",
  firstNamePlaceholder: isSw.value ? "Weka jina lako la kwanza" : "Enter your first name",
  lastNamePlaceholder: isSw.value ? "Weka jina lako la mwisho" : "Enter your last name",
  emailPlaceholder: isSw.value ? "Weka barua pepe yako" : "Enter your email address",
  phonePlaceholder: isSw.value ? "Weka namba yako ya simu" : "Enter your phone number",
  organizationPlaceholder: isSw.value
    ? "Taasisi yako, kwa mfano Ekima Interactive"
    : "Organization (eg: Ekima interctive company)",
  levelPlaceholder: isSw.value ? "(mfano: Kidato cha 1, Kidato cha 2 ...)" : "(eg: Form 1, Form 2 ...)",
  discardChanges: isSw.value ? "Tupa Mabadiliko" : "Discard Changes",
  saveChanges: isSw.value ? "Hifadhi Mabadiliko" : "Save Changes",
  pleaseWait: isSw.value ? "Tafadhali subiri..." : "Please Wait...",
  changesSaved: isSw.value ? "Mabadiliko yamehifadhiwa!" : "Changes Saved Successfully!",
  changesFailed: isSw.value ? "Mabadiliko yameshindwa kuhifadhiwa!" : "Changes Failed to Save!",
  uploadProfilePicture: isSw.value ? "Pakia picha mpya ya wasifu" : "Upload new profile picture",
}));

const regionPlaceholder = computed(() => {
  if (data.status === "idle") return isSw.value ? "Chagua mkoa" : "Select Region";
  if (data.status === "pending") return isSw.value ? "Inapakia..." : "Loading...";
  if (data.status === "error") return data.error ?? (isSw.value ? "Hitilafu imetokea." : "An error occurred.");
  if (data.regions && data.status === "success") return isSw.value ? "Mfano (Mwanza) ..." : "Eg (Mwanza) ...";
  return isSw.value ? "Chagua mkoa" : "Select Region";
});

const schoolPlaceholder = computed(() => {
  if (data.status === "idle") return isSw.value ? "Chagua mkoa na wilaya kwanza" : "Select Region and District First";
  if (data.status === "pending") return isSw.value ? "Inapakia..." : "Loading...";
  if (data.status === "error") return data.error ?? (isSw.value ? "Hitilafu imetokea." : "An error occurred.");
  if (data.schools && data.status === "success")
    return isSw.value ? "Mfano (Shule ya Sekondari Taifa) ..." : "Eg (Taifa Secondary School) ...";
  return isSw.value ? "Chagua shule" : "Select School";
});

const districtPlaceholder = computed(() => {
  if (data.status === "idle") return isSw.value ? "Chagua mkoa kwanza" : "Select Region First";
  if (data.status === "pending") return isSw.value ? "Inapakia..." : "Loading...";
  if (data.status === "error") return data.error ?? (isSw.value ? "Hitilafu imetokea." : "An error occurred.");
  if (data.district && data.status === "success") return isSw.value ? "Mfano (Ilemela) ..." : "Eg (Mwanza) ...";
  return isSw.value ? "Chagua wilaya" : "Select District";
});

const updatedProfile = async () => {
  profile.controller.status = "loading";
  isModified.value = true;

  try {
    const response = await $fetch(apiDocs.auth.profileEdit, {
      method: "PATCH",
      body: {
        name: `${profile.fname} ${profile.lname}`.trim(),
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
      for (const key in response) {
        if (Object.prototype.hasOwnProperty.call(response, key)) {
          const remoteValue = (response as any)[key];
          if (
            remoteValue !== undefined &&
            remoteValue !== null &&
            remoteValue !== ""
          ) {
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
    const message =
      fetchError?.data?.message ||
      fetchError?.message ||
      "An error occurred while updating the profile.";
    console.error(error, { status, message });
  }
};

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

const fetchRegion = async () => {
  data.error = null;

  try {
    const response = await $fetch<any[]>(apiDocs.school.getSchoolRegions);
    data.status = "success";
    data.regions = response;
  } catch (err) {
    data.status = "error";
    data.error = (err as any).message;
  }
};

const fetchDistricts = async (region: string) => {
  data.status = "pending";
  data.error = null;

  try {
    const response = await $fetch<any[]>(
      apiDocs.school.getSchoolDistricts(region.toUpperCase()),
    );
    data.status = "success";
    data.district = response;
  } catch (err) {
    data.status = "error";
    data.error = (err as any).message;
  }
};

const fetchSchools = async (region: string, district: string) => {
  data.status = "pending";
  data.error = null;

  if (!region || !district) {
    data.status = "idle";
    return;
  }

  try {
    const response = await $fetch<any[]>(apiDocs.school.get, {
      query: {
        region: region.toUpperCase(),
        district: district.toUpperCase(),
      },
    });
    data.status = "success";
    data.schools = response;
  } catch (err) {
    data.status = "error";
    data.error = (err as any).message;
  }
};

onMounted(async () => {
  await getLevel();
  await fetchRegion();
  if (profile.region) {
    await fetchDistricts(profile.region);
  }
  if (profile.region && profile.district) {
    await fetchSchools(profile.region, profile.district);
  }
});

watch(
  () => profile.district,
  (district) => {
    if (district) {
      fetchSchools(profile.region, district);
    }
  },
);

watch(
  () => profile.region,
  (region) => {
    if (region) {
      fetchSchools(region, profile.district);
      fetchDistricts(region);
    }
  },
);

const onValueChanged = (inputName: string) => {
  const { fname, lname } = getNameParts();
  const currentLevel = userToken.value?.level?._id ?? userToken.value?.level;

  if (
    inputName == "fname" &&
    profile.fname != fname &&
    profile.fname.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.fname = messages.error.form.firstName;
  } else if (
    inputName == "lname" &&
    profile.lname != lname &&
    profile.lname.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.lname = messages.error.form.lastName;
  } else if (
    inputName == "email" &&
    profile.email != userToken.value?.email &&
    profile.email.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.email = messages.error.form.emailRequired;
  } else if (
    inputName == "phone" &&
    profile.phone != userToken.value?.phoneNumber &&
    profile.phone.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.phone = messages.error.validation.invalidPhone;
  } else if (
    inputName == "organization" &&
    profile.organization != userToken.value?.organization &&
    profile.organization.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.organization = "Please enter your organization";
  } else if (
    inputName == "level" &&
    profile.level != currentLevel &&
    profile.level.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.level = "Please enter your level";
  } else if (
    inputName == "profilePic" &&
    profile.profilePic != userToken.value?.profilePic &&
    profile.profilePic.trim() !== ""
  ) {
    isModified.value = true;
  } else if (
    inputName == "region" &&
    profile.region != userToken.value?.region &&
    profile.region.trim() !== ""
  ) {
    isModified.value = true;
  } else if (
    inputName == "district" &&
    profile.district != userToken.value?.district &&
    profile.district.trim() !== ""
  ) {
    isModified.value = true;
  } else if (
    inputName == "school" &&
    profile.school != userToken.value?.school &&
    profile.school.trim() !== ""
  ) {
    isModified.value = true;
  } else {
    isModified.value = false;
  }
};

const choosePict = async (event: Event) => {
  if (!event.target) return;
  const file = (event.target as HTMLInputElement).files?.[0];
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 2 * 1024 * 1024;

  if (!file) return;

  setTimeout(() => {
    profile.controller.errors.profilePic = null;
    profile.controller.status = "idle";
  }, 1500);

  if (!allowedTypes.includes(file.type)) {
    profile.controller.errors.profilePic =
      "Only JPG, PNG, or WEBP images are allowed.";
    profile.controller.status = "error";
    return;
  }

  if (file.size > maxSize) {
    profile.controller.errors.profilePic = "File size must be under 2MB.";
    profile.controller.status = "error";
    return;
  }

  uploadedPic = file;
  profile.profilePic = URL.createObjectURL(file);

  const formData = new FormData();
  formData.append("profilePic", file);

  await $fetch(apiDocs.auth.profilePicture, {
    method: "PATCH",
    body: formData,
    headers: {
      Authorization: `Bearer ${signInAccessToken.value}`,
    },
  })
    .then((response) => {
      if (response) {
        profile.controller.status = "success";
        profile.controller.feedback = "profile picture updated successfully";
      }
    })
    .catch((error) => {
      profile.controller.status = "error";
      profile.controller.feedback = error.message;
    });
};

const discardChanges = () => {
  const resetProfile = createProfileState();

  profile.fname = resetProfile.fname;
  profile.lname = resetProfile.lname;
  profile.email = resetProfile.email;
  profile.phone = resetProfile.phone;
  profile.organization = resetProfile.organization;
  profile.region = resetProfile.region;
  profile.district = resetProfile.district;
  profile.school = resetProfile.school;
  profile.level = resetProfile.level;
  profile.type = resetProfile.type;
  profile.profilePic = resetProfile.profilePic;
  isModified.value = false;
};
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <MessageComponent
      :message="profile.controller.errors.profilePic as string"
      :position="profile.controller.errors.profilePic ? true : false"
      :event-type="
        profile.controller.status === 'success' ? 'success' : 'error'
      "
      :icon="
        profile.controller.status === 'success'
          ? 'icons8:checked'
          : 'oui:cross-in-circle-empty'
      "
    />

    <div class="flex flex-col items-center justify-center w-full">
      <div class="relative inline-flex items-center justify-center">
        <div
          class="relative overflow-hidden transition-all duration-500 ease-in-out rounded-full cursor-pointer w-36 h-36 group"
        >
          <NuxtImg
            :src="
              profile.profilePic && profile.profilePic.trim() !== ''
                ? uploadedPic
                  ? profile.profilePic
                  : apiDocs.baseURL.replace('v1', '') + profile.profilePic
                : '/profile/profile2.jpeg'
            "
            alt="User Profile"
            class="object-cover w-full h-full transition-all duration-500 ease-in-out transform group-hover:scale-110 group-hover:opacity-10"
          />

          <ProfileDrawInitialLater
            class="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100"
          />
        </div>

        <label
          for="picture_input"
          class="absolute rounded-full bottom-2 right-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-oceanBlue"
          :aria-label="profileText.uploadProfilePicture"
        >
          <div
            class="flex items-center justify-center p-2 bg-white rounded-full shadow-md"
          >
            <IconsCamera
              :size="24"
              class="text-deepBlue"
            />
          </div>
        </label>
        <input
          id="picture_input"
          type="file"
          accept="image/*"
          class="hidden"
          style="display: none"
          hidden
          @change="choosePict"
        />
      </div>

      <div class="flex flex-col items-center justify-center mt-4">
        <h1 class="font-bold text-large">{{ userToken?.name }}</h1>
        <h3 class="my-1 text-textGray text-medium">{{ userToken?.type }}</h3>
      </div>
    </div>
    <div
      class="flex flex-col w-full mt-5 gap-3 p-5 bg-white border shadow-sm rounded-3xl border-slate-200 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <p
          class="text-sm font-medium uppercase tracking-[0.2em] text-oceanBlue"
        >
          {{ profileText.profile }}
        </p>
        <h1 class="mt-2 text-2xl font-semibold text-slate-900">
          {{ profileText.personalDetails }}
        </h1>
        <p class="mt-2 text-sm leading-6 text-slate-600">
          {{ profileText.manageAccount }}
        </p>
      </div>

      <NuxtLink
        to="/profile/learning-statistics"
        class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl bg-oceanBlue hover:bg-deepBlue"
      >
        <Icon
          name="heroicons:chart-bar-square-20-solid"
          class="w-5 h-5"
        />
        <span>{{ profileText.openLearningStatistics }}</span>
      </NuxtLink>
    </div>
    <div class="w-full mx-auto my-6">
      <div class="bg-white border border-gray-100 rounded-md shadow-md">
        <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
          <h3 class="text-lg font-semibold text-white">{{ profileText.personalInformation }}</h3>
        </div>

        <div class="p-6">
          <div
            class="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <div class="relative group">
              <label
                for="fname"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.firstName }}
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
                  id="fname"
                  v-model="profile.fname"
                  type="text"
                  name="fname"
                  autocomplete="off-name"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  :placeholder="profileText.firstNamePlaceholder"
                  @input="onValueChanged('fname')"
                  @keydown.space.prevent
                />
              </div>
            </div>

            <div class="relative group">
              <label
                for="lname"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.lastName }}
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
                  id="lname"
                  v-model="profile.lname"
                  type="text"
                  name="lname"
                  autocomplete="off-name"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  :placeholder="profileText.lastNamePlaceholder"
                  @input="onValueChanged('lname')"
                  @keydown.space.prevent
                />
              </div>
            </div>

            <div
              v-if="profile.type.toLowerCase() !== 'student'"
              class="relative group"
            >
              <label
                for="email"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.emailAddress }}
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
                  id="email"
                  v-model="profile.email"
                  type="email"
                  name="username"
                  autocomplete="off"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  :placeholder="profileText.emailPlaceholder"
                  @input="onValueChanged('email')"
                />
              </div>
            </div>

            <div
              v-if="profile.type.toLowerCase() !== 'student'"
              class="relative group"
            >
              <label
                for="phone"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.phoneNumber }}
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
                  id="phone"
                  v-model="profile.phone"
                  type="tel"
                  name="phone"
                  autocomplete="off"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  :placeholder="profileText.phonePlaceholder"
                  @input="onValueChanged('phone')"
                />
              </div>
            </div>

            <div
              v-if="profile.type.toLowerCase() !== 'student'"
              class="relative group"
            >
              <label
                for="organization"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.organization }}
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
                  id="organization"
                  v-model="profile.organization"
                  type="text"
                  name="organization"
                  autocomplete="off"
                  class="w-full py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  :placeholder="profileText.organizationPlaceholder"
                  @input="onValueChanged('organization')"
                  @keydown.space.prevent
                />
              </div>
            </div>

            <div class="relative group">
              <label
                for="region"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.region }}
              </label>

              <div class="relative flex items-center">
                <span class="absolute flex items-center left-3">
                  <Icon
                    name="heroicons:map"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>

                <CustomDropDownList
                  id="region"
                  v-model="profile.region"
                  name="region"
                  :list="regionOptions"
                  :placeholder="regionPlaceholder"
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  @update-model-value="
                    (value: string) => {
                      profile.region = value;
                      onValueChanged('region');
                    }
                  "
                />
              </div>
            </div>

            <div class="relative group">
              <label
                for="district"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.district }}
              </label>

              <div class="relative flex items-center">
                <span class="absolute flex items-center left-3">
                  <Icon
                    name="heroicons:map"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>

                <CustomDropDownList
                  id="district"
                  v-model="profile.district"
                  name="district"
                  :list="districtOptions"
                  :placeholder="districtPlaceholder"
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  @update-model-value="
                    (value: string) => {
                      profile.district = value;
                      onValueChanged('district');
                    }
                  "
                />
              </div>
            </div>

            <div
              v-if="profile.type.toLowerCase() !== 'educationstakeholder'"
              class="relative group"
            >
              <label
                for="school"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.school }}
              </label>

              <div class="relative flex items-center">
                <span class="absolute flex items-center left-3">
                  <Icon
                    name="tdesign:institution"
                    class="w-5 h-5 transition-colors duration-500 text-textGray group-focus-within:text-deepBlue"
                  />
                </span>

                <CustomDropDownList
                  id="school"
                  v-model="profile.school"
                  name="school"
                  :list="schoolOptions"
                  :placeholder="schoolPlaceholder"
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  @update-model-value="
                    (value: string) => {
                      profile.school = value;
                      onValueChanged('school');
                    }
                  "
                />
              </div>
            </div>

            <div
              v-if="
                !['teacher', 'educationstakeholder'].includes(
                  profile.type.toLowerCase(),
                )
              "
              class="relative group"
            >
              <label
                for="level"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                {{ profileText.level }}
              </label>

              <div class="relative flex items-center">
                <CustomDropDownList
                  v-model="profile.level"
                  :list="levelsLists"
                  :placeholder="profileText.levelPlaceholder"
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                  @update-model-value="
                    (value: string) => {
                      profile.level = value;
                      onValueChanged('level');
                    }
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="isModified"
        class="flex items-center justify-between w-full gap-4 mt-8"
      >
        <button
          type="reset"
          class="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium transition-colors duration-500 ease-in-out border-2 rounded-md hover:text-white text-deepBlue border-oceanBlue hover:bg-gradient-to-r from-deepBlue to-oceanBlue hover:shadow-md"
          @click="discardChanges"
        >
          {{ profileText.discardChanges }}
          <Icon
            name="heroicons:arrow-right"
            class="w-4 h-4"
          />
        </button>

        <button
          type="submit"
          :disabled="
            profile.controller.status === 'loading' || isModified == false
          "
          :aria-busy="
            profile.controller.status === 'loading' ? 'true' : 'false'
          "
          :class="[
            'flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all duration-500 rounded-md bg-gradient-to-r to-oceanBlue from-deepBlue hover:shadow-md',
            profile.controller.status === 'loading'
              ? 'cursor-not-allowed opacity-70'
              : 'cursor-pointer',
            profile.controller.status === 'success'
              ? 'bg-green-500 cursor-not-allowed'
              : 'cursor-pointer',
            profile.controller.feedback === 'error'
              ? 'bg-red-500 cursor-not-allowed'
              : 'cursor-pointer',
          ]"
          @click="updatedProfile()"
        >
          <div
            v-if="profile.controller.status === 'loading'"
            class="flex items-center justify-center gap-4"
          >
            <span>{{ profileText.pleaseWait }}</span>
            <IconsLoading
              class="text-white"
              :size="20"
            />
          </div>

          <div
            v-else-if="profile.controller.status === 'success'"
            class="flex items-center justify-center gap-4"
          >
            <span>{{ profileText.changesSaved }}</span>
            <IconsChecked
              class="text-white"
              :size="20"
            />
          </div>

          <div
            v-else-if="profile.controller.feedback === 'error'"
            class="flex items-center justify-center gap-4"
          >
            <span>{{ profileText.changesFailed }}</span>
            <IconsCrossCircle
              class="text-white"
              :size="20"
            />
          </div>

          <div
            v-else
            class="flex items-center justify-center gap-4"
          >
            {{ profileText.saveChanges }}
            <Icon
              name="heroicons:arrow-right"
              class="w-4 h-4"
            />
          </div>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
  will-change: opacity, transform;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
