<script setup lang="ts">
import MarkdownIt from "markdown-it";
import messages from "~/utilities/messages";
import { MessageComponent, ProfileDrawInitialLater } from "#components";
import apiDocs from "~/utilities/apiDocs";
import type { Level } from "~/types/level.interface";
import type {
  PersonalizedRecommendation,
  PersonalizedRecommendationsResponse,
  RecommendationAction,
  SubjectLearningAnalysis,
  TalkToDataResponse,
  TopicAssessmentStatus,
  TopicLearningAnalysis,
  TopicLearningStatus,
} from "~/types/recommendation.interface";
import { FetchError } from "ofetch";

// Defien Status
type Status = "idle" | "pending" | "loading" | "success" | "error";

// Define Cookie
const signInAccessToken = useCookie<string>("signInAccessToken");
const userToken = useCookie<any>("signInUserToken");
const route = useRoute();
const router = useRouter();
const tieOverlayOpen = useState<boolean>("tie-ai-overlay-open", () => false);
const tieOverlayOpening = useState<boolean>(
  "tie-ai-overlay-opening",
  () => false,
);
const tieOverlayBackground = useState<string>(
  "tie-ai-overlay-background",
  () => "",
);
const tieOverlayPushed = useState<boolean>(
  "tie-ai-overlay-pushed",
  () => false,
);
const { setDraft: setAiTeacherDraft } = useAiTeacherDraft();
let uploadedPic: any;

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
});

// Define Two State
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

// List
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
  if (data.schools && data.status === "success")
    return "Eg (Taifa Secondary School) ...";
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
    console.error(error, { status: status, message: message });
  }
};

// Fetch Profile Data
const {
  data: profileData,
  status,
  error,
} = await useFetch<any>(apiDocs.auth.profile, {
  headers: {
    Authorization: `Bearer ${signInAccessToken.value}`,
  },
});

const {
  data: personalizedRecommendations,
  status: recommendationStatus,
  error: recommendationError,
} = await useFetch<PersonalizedRecommendationsResponse>(
  "/api/recommendations/personalized",
);

const recommendationCards = computed(
  () => personalizedRecommendations.value?.recommendations ?? [],
);
const recommendationOverview = computed(
  () => personalizedRecommendations.value?.overview ?? null,
);
const subjectBreakdown = computed(
  () => personalizedRecommendations.value?.subjectBreakdown ?? [],
);
const talkToDataQuestion = ref("");
const talkToDataAnswer = ref("");
const talkToDataError = ref("");
const talkToDataGeneratedAt = ref("");
const talkToDataStatus = ref<Status>("idle");
const talkToDataPrompts = [
  "Which topics have I not covered yet?",
  "Which subject is my weakest right now?",
  "Show me the topics where I am failing.",
  "What should I revise before the teacher reviews me?",
];
const talkToDataMarkdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

const actionLabels: Record<RecommendationAction, string> = {
  start_topic: "Start topic",
  rewatch_video: "Rewatch video",
  review_notes: "Review notes",
  practice_quiz: "Practice quiz",
};

const actionHelperLabels: Record<RecommendationAction, string> = {
  start_topic: "Start topic",
  rewatch_video: "Revisit lesson",
  review_notes: "Open topic notes",
  practice_quiz: "Review then practice",
};

const reasonLabels: Record<string, string> = {
  not_started: "Not started",
  low_progress: "Low progress",
  low_assessment: "Low assessment",
  started_not_finished: "Started, not finished",
  needs_practice: "Needs practice",
};

const topicStatusLabels: Record<TopicLearningStatus, string> = {
  covered: "Covered",
  in_progress: "In progress",
  opened_only: "Opened only",
  not_started: "Not started",
};

const assessmentStatusLabels: Record<TopicAssessmentStatus, string> = {
  passed: "Passed",
  failed: "Failed",
  not_attempted: "Not attempted",
};

const formatRecommendationAction = (action: RecommendationAction) =>
  actionLabels[action] ?? action.replaceAll("_", " ");

const formatRecommendationActionHelper = (action: RecommendationAction) =>
  actionHelperLabels[action] ?? "Open topic";

const formatReasonCode = (reasonCode: string) =>
  reasonLabels[reasonCode] ?? reasonCode.replaceAll("_", " ");

const formatTopicStatus = (status: TopicLearningStatus) =>
  topicStatusLabels[status] ?? status.replaceAll("_", " ");

const formatAssessmentStatus = (status: TopicAssessmentStatus) =>
  assessmentStatusLabels[status] ?? status.replaceAll("_", " ");

const buildRecommendationMeta = (
  recommendation: PersonalizedRecommendation,
) => {
  const meta = [recommendation.subjectName];
  if (recommendation.levelName) {
    meta.push(recommendation.levelName);
  }
  return meta.join(" | ");
};

const getTopicStatusClass = (status: TopicLearningStatus) => {
  if (status === "covered") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "in_progress") {
    return "bg-sky-100 text-sky-800";
  }
  if (status === "opened_only") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-slate-100 text-slate-700";
};

const getAssessmentStatusClass = (status: TopicAssessmentStatus) => {
  if (status === "passed") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "failed") {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-slate-100 text-slate-700";
};

const buildSubjectCoverageWidth = (subject: SubjectLearningAnalysis) => {
  if (!subject.totalTopics) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((subject.coveredTopics / subject.totalTopics) * 100),
    ),
  );
};

const formatTopicChapterProgress = (topic: TopicLearningAnalysis) => {
  if (!topic.totalChapters) return "No chapter data";
  return `${topic.completedChapters}/${topic.totalChapters} chapters`;
};

const buildTopicAnalysisPrompt = (topic: TopicLearningAnalysis) => {
  const scorePart =
    topic.assessmentScore !== null
      ? ` My latest quiz score is ${topic.assessmentScore}%.`
      : "";

  return `Help me study ${topic.topicName} in ${topic.subjectName}. My progress is ${topic.progressPercent}%.${scorePart} Show me what I have likely covered, what I have not yet covered, and give me a short plan with practice questions.`;
};

const renderTalkToDataAnswer = (value: string) => {
  if (!value.trim()) return "";
  return talkToDataMarkdown.render(value);
};

const formatGeneratedAt = (value: string) => {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const askTalkToData = async (presetQuestion?: string) => {
  const resolvedQuestion = (presetQuestion ?? talkToDataQuestion.value).trim();
  if (!resolvedQuestion) {
    talkToDataStatus.value = "error";
    talkToDataError.value = "Ask a question about your own learning data.";
    return;
  }

  talkToDataQuestion.value = resolvedQuestion;
  talkToDataStatus.value = "loading";
  talkToDataError.value = "";

  try {
    const response = await $fetch<TalkToDataResponse>(
      "/api/profile/talk-to-data",
      {
        method: "POST",
        body: {
          question: resolvedQuestion,
        },
      },
    );

    talkToDataAnswer.value = response.answer;
    talkToDataGeneratedAt.value = response.generatedAt;
    talkToDataStatus.value = "success";
  } catch (error: any) {
    talkToDataStatus.value = "error";
    talkToDataError.value =
      error?.data?.message ||
      error?.message ||
      "Failed to analyze your learning data right now.";
  }
};

const getSubjectPriorityTopics = (subject: SubjectLearningAnalysis) => {
  return [...subject.topics]
    .sort((left, right) => {
      const leftRisk =
        (left.assessmentStatus === "failed" ? 40 : 0) +
        (left.topicStatus === "not_started" ? 30 : 0) +
        (left.topicStatus === "opened_only" ? 20 : 0) +
        (left.topicStatus === "in_progress" ? 10 : 0) +
        (100 - left.progressPercent);
      const rightRisk =
        (right.assessmentStatus === "failed" ? 40 : 0) +
        (right.topicStatus === "not_started" ? 30 : 0) +
        (right.topicStatus === "opened_only" ? 20 : 0) +
        (right.topicStatus === "in_progress" ? 10 : 0) +
        (100 - right.progressPercent);

      return rightRisk - leftRisk;
    })
    .slice(0, 3)
    .map((topic) => topic.topicName);
};

const getSubjectHealthLabel = (subject: SubjectLearningAnalysis) => {
  if (subject.failedTopics > 0) return "Needs attention";
  if (subject.notStartedTopics > 0) return "Has gaps";
  if (subject.inProgressTopics + subject.openedTopics > 0) return "In progress";
  return "Strong";
};

const getSubjectHealthClass = (subject: SubjectLearningAnalysis) => {
  if (subject.failedTopics > 0) return "bg-rose-100 text-rose-800";
  if (subject.notStartedTopics > 0) return "bg-amber-100 text-amber-800";
  if (subject.inProgressTopics + subject.openedTopics > 0) {
    return "bg-sky-100 text-sky-800";
  }
  return "bg-emerald-100 text-emerald-800";
};

const openAiTeacherWithPrompt = async (seedPrompt: string) => {
  if (!seedPrompt.trim()) return;

  setAiTeacherDraft(seedPrompt);
  tieOverlayOpening.value = true;

  try {
    tieOverlayBackground.value = route.fullPath;
    tieOverlayPushed.value = true;
    await router.push({
      query: {
        ...route.query,
        overlay: "1",
      },
      state: {
        aiOverlay: true,
        aiOverlayBackground: route.fullPath,
      },
    });
    tieOverlayOpen.value = true;
  } finally {
    tieOverlayOpening.value = false;
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

// Fetch Region function
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

// Fetch district function
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
      },
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
});

// Watch for changes in region or district (School)
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
      // Watch for changes in region or district (School)
      fetchDistricts(region);
    }
  },
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
  },
);

const onValueChanged = (inputName: string) => {
  if (
    inputName == "fname" &&
    profile.fname != userToken.value.name.split(" ")[0] &&
    profile.fname.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.fname = messages.error.form.firstName;
  } else if (
    inputName == "lname" &&
    profile.lname != userToken.value.name.split(" ")[1] &&
    profile.lname.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.lname = messages.error.form.lastName;
  } else if (
    inputName == "email" &&
    profile.email != userToken.value.email &&
    profile.email.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.email = messages.error.form.emailRequired;
  } else if (
    inputName == "phone" &&
    profile.phone != userToken.value.phoneNumber &&
    profile.phone.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.phone = messages.error.validation.invalidPhone;
  } else if (
    inputName == "organization" &&
    profile.organization != userToken.value.organization &&
    profile.organization.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.organization = "Please enter your organization";
  } else if (
    inputName == "level" &&
    profile.level != userToken.value.level &&
    profile.level.trim() !== ""
  ) {
    isModified.value = true;
    profile.controller.errors.level = "Please enter your level";
  } else if (
    inputName == "profilePic" &&
    profile.profilePic != userToken.value.profilePic &&
    profile.profilePic.trim() !== ""
  ) {
    isModified.value = true;
  } else if (
    inputName == "region" &&
    profile.region != userToken.value.region &&
    profile.region.trim() !== ""
  ) {
    isModified.value = true;
  } else if (
    inputName == "district" &&
    profile.district != userToken.value.district &&
    profile.district.trim() !== ""
  ) {
    isModified.value = true;
  } else if (
    inputName == "school" &&
    profile.school != userToken.value.school &&
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
  const maxSize = 2 * 1024 * 1024; // 2MB

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

  // Update profile picture in server
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
        // profile.profilePic = response;
        profile.controller.status = "success";
        profile.controller.feedback = "profile picture updated successfully";
      }
    })
    .catch((error) => {
      profile.controller.status = "error";
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
  profile.district =
    userToken.value.district == null || userToken.value.district == undefined
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
};
</script>

<template>
  <div
    v-if="status == 'pending'"
    class="flex items-center justify-center w-full max-w-7xl'"
  >
    <LoadingIndicator :is-loading="true" />
  </div>

  <div
    v-else-if="status == 'success'"
    class="flex flex-col items-center justify-center w-full max-w-7xl"
  >
    <!-- Message Component -->
    <MessageComponent
      :message="profile.controller.errors.profilePic as string"
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
                ? uploadedPic
                  ? profile.profilePic
                  : apiDocs.baseURL.replace('v1', '') + profile.profilePic
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
            <IconsCamera
              :size="24"
              class="text-deepBlue"
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
        <h1 class="font-bold text-large">{{ userToken?.name }}</h1>
        <!-- Type -->
        <h3 class="my-1 text-textGray text-medium">{{ userToken?.type }}</h3>
      </div>
    </div>

    <!-- Learning Statistics -->
    <div
      class="w-full mx-auto my-4 overflow-hidden bg-white rounded-xl shadow-lg border border-slate-100"
    >
      <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
        <h3 class="text-lg font-semibold text-white">Learning Statistics</h3>
      </div>
      <div
        class="grid w-full grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-5"
      >
        <!-- Competences Opened -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-blue-100 text-deepBlue">
            <Icon
              name="fa6-solid:book-open-reader"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Competences Opened</span>
            <span class="profile-stat-value">{{
              profileData?.totalTopicsOpened ?? 0
            }}</span>
          </div>
        </div>
        <!-- Subject Opened -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-green-100 text-emerald-700">
            <Icon
              name="heroicons:folder-open-20-solid"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Subject Opened</span>
            <span class="profile-stat-value">{{
              profileData?.openedSubjects ?? 0
            }}</span>
          </div>
        </div>
        <!-- Time Spent -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-red-100 text-red-600">
            <Icon
              name="stash:clock-solid"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Time Spent</span>
            <span class="profile-stat-value">{{
              profileData?.timeSpentFormatted ?? "0h 0m"
            }}</span>
          </div>
        </div>
        <!-- Quiz Attempts -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-purple-100 text-purple-600">
            <Icon
              name="solar:notebook-bold"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Quiz Attempts</span>
            <span class="profile-stat-value">{{
              profileData?.questionStats?.totalAttempted != null
                ? Number(profileData.questionStats.totalAttempted).toFixed(0)
                : "0"
            }}</span>
          </div>
        </div>
        <!-- Average Quiz Score -->
        <div class="profile-stat-card">
          <div class="profile-stat-icon bg-indigo-100 text-indigo-600">
            <Icon
              name="heroicons:chart-bar-16-solid"
              size="20"
              class="w-6 h-6"
            />
          </div>
          <div class="profile-stat-content">
            <span class="profile-stat-label">Average Quiz Score</span>
            <span class="profile-stat-value"
              >{{
                profileData?.questionStats?.averageScore != null
                  ? Number(profileData.questionStats.averageScore).toFixed(1)
                  : "—"
              }}%</span
            >
          </div>
        </div>
      </div>

      <div
        v-if="recommendationStatus === 'pending'"
        class="p-6 space-y-4 bg-[#f8fbfd]"
      >
        <div class="w-2/3 h-4 rounded bg-slate-200 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
        <div class="w-full h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
      </div>

      <div
        v-else-if="recommendationError"
        class="p-6 bg-[#f8fbfd]"
      >
        <div
          class="p-4 border border-amber-200 rounded-2xl bg-amber-50 text-amber-900"
        >
          <p class="font-medium">
            Personalized recommendations are temporarily unavailable.
          </p>
          <p class="mt-1 text-sm">
            Your profile data is still available. Try refreshing the page in a
            moment.
          </p>
        </div>
      </div>

      <div
        v-else-if="!recommendationOverview && recommendationCards.length === 0"
        class="p-6 bg-[#f8fbfd]"
      >
        <div class="p-5 border border-emerald-100 rounded-3xl bg-emerald-50/80">
          <p class="font-medium text-emerald-900">
            {{
              personalizedRecommendations?.summary ||
              "You are keeping up well with your recent topics."
            }}
          </p>
          <p class="mt-2 text-sm text-emerald-800">
            Keep reviewing your latest lessons and continue with the next topic
            in your current subject.
          </p>
        </div>
      </div>

      <div
        v-else
        class="p-6 space-y-5 bg-[#f8fbfd]"
      >
        <div class="p-5 border border-sky-100 rounded-3xl bg-white shadow-sm">
          <p class="text-sm leading-6 text-slate-700">
            {{ personalizedRecommendations?.summary }}
          </p>
        </div>

        <div
          v-if="recommendationOverview"
          class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <div class="p-4 bg-white border rounded-3xl border-slate-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-slate-500"
            >
              Total Topics
            </p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">
              {{ recommendationOverview.totalTopics }}
            </p>
          </div>
          <div class="p-4 bg-white border rounded-3xl border-emerald-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-emerald-700"
            >
              Covered
            </p>
            <p class="mt-2 text-2xl font-semibold text-emerald-900">
              {{ recommendationOverview.coveredTopics }}
            </p>
          </div>
          <div class="p-4 bg-white border rounded-3xl border-sky-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-sky-700"
            >
              In Progress
            </p>
            <p class="mt-2 text-2xl font-semibold text-sky-900">
              {{
                recommendationOverview.inProgressTopics +
                recommendationOverview.openedTopics
              }}
            </p>
          </div>
          <div class="p-4 bg-white border rounded-3xl border-slate-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-slate-500"
            >
              Not Started
            </p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">
              {{ recommendationOverview.notStartedTopics }}
            </p>
          </div>
          <div class="p-4 bg-white border rounded-3xl border-amber-200">
            <p
              class="text-xs font-semibold tracking-wide uppercase text-amber-700"
            >
              Quiz Status
            </p>
            <p class="mt-2 text-2xl font-semibold text-amber-900">
              {{ recommendationOverview.passedTopics }}/{{
                recommendationOverview.failedTopics
              }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Passed / Failed topics</p>
          </div>
        </div>

        <section
          v-if="recommendationOverview"
          class="p-5 bg-white border rounded-3xl border-slate-200 shadow-sm"
        >
          <div
            class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
          >
            <div>
              <h4 class="text-lg font-semibold text-slate-900">
                Deep Learner Analysis
              </h4>
              <p class="mt-1 text-sm leading-6 text-slate-600">
                Full syllabus view for the student level: covered topics,
                untouched topics, started work, and assessment outcomes.
              </p>
            </div>

            <div class="grid gap-2 sm:grid-cols-2">
              <div class="px-3 py-2 rounded-2xl bg-slate-50">
                <p class="text-xs uppercase text-slate-500">Average progress</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ recommendationOverview.averageProgress }}%
                </p>
              </div>
              <div class="px-3 py-2 rounded-2xl bg-slate-50">
                <p class="text-xs uppercase text-slate-500">
                  Assessment average
                </p>
                <p class="text-sm font-semibold text-slate-900">
                  {{
                    recommendationOverview.averageAssessmentScore !== null
                      ? `${recommendationOverview.averageAssessmentScore}%`
                      : "No quiz data"
                  }}
                </p>
              </div>
              <div class="px-3 py-2 rounded-2xl bg-slate-50">
                <p class="text-xs uppercase text-slate-500">Subjects opened</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ recommendationOverview.subjectsOpened }}/{{
                    recommendationOverview.totalSubjects
                  }}
                </p>
              </div>
              <div class="px-3 py-2 rounded-2xl bg-slate-50">
                <p class="text-xs uppercase text-slate-500">Quiz attempts</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ recommendationOverview.totalAssessmentAttempts }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          class="p-5 bg-white border rounded-3xl border-slate-200 shadow-sm"
        >
          <div
            class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <h4 class="text-lg font-semibold text-slate-900">
                Talk To Your Data
              </h4>
              <p class="mt-1 text-sm leading-6 text-slate-600">
                Ask questions about your own learning record: covered topics,
                weak areas, failed quizzes, unfinished work, and what to revise
                next.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="prompt in talkToDataPrompts"
                :key="prompt"
                type="button"
                class="px-3 py-2 text-xs font-medium transition-colors border rounded-full border-oceanBlue/15 bg-oceanBlue/5 text-oceanBlue hover:bg-oceanBlue/10"
                @click="askTalkToData(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>

          <div class="mt-5 space-y-4">
            <label
              for="talk-to-data-input"
              class="block text-sm font-medium text-slate-700"
            >
              Ask about your learning data
            </label>
            <textarea
              id="talk-to-data-input"
              v-model="talkToDataQuestion"
              rows="4"
              class="w-full px-4 py-3 text-sm transition-colors border rounded-2xl resize-y border-slate-200 bg-slate-50 focus:border-oceanBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/20"
              placeholder="Example: Which topics have I not covered yet, and where am I failing?"
            ></textarea>

            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p class="text-xs text-slate-500">
                The answer is grounded in your profile progress, topic coverage,
                and assessment data.
              </p>

              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="talkToDataStatus === 'loading'"
                @click="askTalkToData()"
              >
                <Icon
                  name="heroicons:chart-bar-square"
                  class="w-5 h-5"
                />
                <span>
                  {{
                    talkToDataStatus === "loading"
                      ? "Analyzing..."
                      : "Ask Your Data"
                  }}
                </span>
              </button>
            </div>

            <div
              v-if="talkToDataStatus === 'error'"
              class="p-4 border rounded-2xl border-rose-200 bg-rose-50 text-rose-800"
            >
              <p class="text-sm font-medium">
                {{ talkToDataError }}
              </p>
            </div>

            <div
              v-else-if="talkToDataStatus === 'success' && talkToDataAnswer"
              class="p-5 border rounded-2xl border-sky-100 bg-sky-50/70"
            >
              <div
                class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
              >
                <p
                  class="text-xs font-semibold tracking-wide uppercase text-oceanBlue"
                >
                  Answer From Your Learning Data
                </p>
                <p
                  v-if="talkToDataGeneratedAt"
                  class="text-xs text-slate-500"
                >
                  {{ formatGeneratedAt(talkToDataGeneratedAt) }}
                </p>
              </div>

              <div
                class="mt-3 prose prose-sm max-w-none text-slate-700 prose-p:my-2 prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-strong:font-semibold prose-headings:text-slate-900"
                v-html="renderTalkToDataAnswer(talkToDataAnswer)"
              ></div>
            </div>
          </div>
        </section>

        <section
          v-if="subjectBreakdown.length > 0"
          class="space-y-4"
        >
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-semibold text-slate-900">
              Subject Breakdown
            </h4>
            <p class="text-sm text-slate-500">
              Coverage and performance by subject
            </p>
          </div>

          <details
            v-for="subject in subjectBreakdown"
            :key="subject.subjectName"
            class="overflow-hidden bg-white border rounded-3xl border-slate-200 shadow-sm group"
          >
            <summary
              class="flex flex-col gap-4 p-5 list-none cursor-pointer lg:flex-row lg:items-start lg:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h5 class="text-base font-semibold text-slate-900">
                    {{ subject.subjectName }}
                  </h5>
                  <span
                    class="px-2.5 py-1 text-xs font-medium rounded-full"
                    :class="getSubjectHealthClass(subject)"
                  >
                    {{ getSubjectHealthLabel(subject) }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-slate-500">
                  {{
                    [
                      subject.levelName,
                      `${subject.coveredTopics}/${subject.totalTopics} covered`,
                      `${subject.failedTopics} failed`,
                    ]
                      .filter(Boolean)
                      .join(" | ")
                  }}
                </p>
                <p class="mt-2 text-xs leading-5 text-slate-500">
                  Priority topics:
                  {{
                    getSubjectPriorityTopics(subject).join(", ") ||
                    "No urgent topic gaps"
                  }}
                </p>
              </div>

              <div class="w-full max-w-xl">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex-1">
                    <div class="flex justify-between text-xs text-slate-500">
                      <span>Coverage</span>
                      <span>{{ buildSubjectCoverageWidth(subject) }}%</span>
                    </div>
                    <div
                      class="h-2 mt-2 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        class="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-oceanBlue to-deepBlue"
                        :style="{
                          width: `${buildSubjectCoverageWidth(subject)}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                  <div
                    class="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 group-open:rotate-180"
                  >
                    <Icon
                      name="heroicons:chevron-down-20-solid"
                      class="w-5 h-5"
                    />
                  </div>
                </div>
                <div
                  class="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600 sm:grid-cols-4"
                >
                  <span
                    class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700"
                  >
                    Covered {{ subject.coveredTopics }}
                  </span>
                  <span class="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                    In progress
                    {{ subject.inProgressTopics + subject.openedTopics }}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"
                  >
                    Not started {{ subject.notStartedTopics }}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700"
                  >
                    Quiz attempts {{ subject.assessmentAttempts }}
                  </span>
                </div>
              </div>
            </summary>

            <div class="px-5 pb-5 border-t border-slate-100 bg-slate-50/70">
              <div class="py-3 text-xs text-slate-500">
                Showing topic-level details for {{ subject.subjectName }}.
              </div>
              <div class="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                <article
                  v-for="topic in subject.topics"
                  :key="topic.topicId"
                  class="flex flex-col gap-4 p-4 bg-white border rounded-2xl border-slate-200 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="px-2.5 py-1 text-xs font-medium rounded-full"
                        :class="getTopicStatusClass(topic.topicStatus)"
                      >
                        {{ formatTopicStatus(topic.topicStatus) }}
                      </span>
                      <span
                        class="px-2.5 py-1 text-xs font-medium rounded-full"
                        :class="
                          getAssessmentStatusClass(topic.assessmentStatus)
                        "
                      >
                        {{ formatAssessmentStatus(topic.assessmentStatus) }}
                      </span>
                    </div>

                    <h6 class="mt-3 text-sm font-semibold text-slate-900">
                      {{ topic.topicName }}
                    </h6>

                    <div
                      class="flex flex-wrap gap-2 mt-3 text-xs text-slate-600"
                    >
                      <span class="px-2.5 py-1 rounded-full bg-slate-100">
                        Progress {{ topic.progressPercent }}%
                      </span>
                      <span class="px-2.5 py-1 rounded-full bg-slate-100">
                        {{ formatTopicChapterProgress(topic) }}
                      </span>
                      <span class="px-2.5 py-1 rounded-full bg-slate-100">
                        Attempts {{ topic.assessmentAttempts }}
                      </span>
                      <span
                        v-if="topic.assessmentScore !== null"
                        class="px-2.5 py-1 rounded-full bg-slate-100"
                      >
                        Quiz {{ topic.assessmentScore }}%
                      </span>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3 sm:flex-row">
                    <NuxtLink
                      :to="topic.revisitPath"
                      class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border rounded-xl border-oceanBlue/20 text-oceanBlue hover:bg-oceanBlue/5"
                    >
                      <Icon
                        name="heroicons:play-circle"
                        class="w-5 h-5"
                      />
                      <span>Open Topic</span>
                    </NuxtLink>

                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors rounded-xl bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40"
                      @click="
                        openAiTeacherWithPrompt(buildTopicAnalysisPrompt(topic))
                      "
                    >
                      <Icon
                        name="heroicons:sparkles"
                        class="w-5 h-5"
                      />
                      <span>Analyze with AI</span>
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </details>
        </section>

        <div
          v-if="recommendationCards.length === 0"
          class="p-5 border border-emerald-100 rounded-3xl bg-emerald-50/80"
        >
          <p class="font-medium text-emerald-900">
            No urgent revision topics were found right now.
          </p>
          <p class="mt-2 text-sm text-emerald-800">
            Use the breakdown above to keep reviewing untouched or partially
            completed topics before the teacher checks your progress.
          </p>
        </div>

        <article
          v-for="recommendation in recommendationCards"
          :key="recommendation.topicId"
          class="overflow-hidden bg-white border border-slate-200 shadow-sm rounded-3xl"
        >
          <NuxtLink
            :to="recommendation.revisitPath"
            class="block p-5 transition-all duration-300 group hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-oceanBlue/40"
          >
            <div
              class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-slate-100 text-slate-600"
                  >
                    <Icon
                      name="fa6-solid:book-open-reader"
                      class="w-3.5 h-3.5"
                    />
                    Revisit Compitence
                  </span>
                  <span
                    class="px-2.5 py-1 text-xs font-semibold rounded-full bg-oceanBlue/10 text-oceanBlue"
                  >
                    {{
                      formatRecommendationAction(
                        recommendation.recommendedAction,
                      )
                    }}
                  </span>
                </div>

                <h4
                  class="mt-3 text-lg font-semibold text-slate-900 group-hover:text-deepBlue"
                >
                  {{ recommendation.topicName }}
                </h4>
                <!-- <p class="mt-1 text-sm text-slate-500">
                  {{ buildRecommendationMeta(recommendation) }}
                </p> -->

                <p class="mt-4 text-sm leading-6 text-slate-700">
                  {{ recommendation.explanation }}
                </p>

                <div
                  class="p-4 mt-4 border rounded-2xl border-sky-100 bg-sky-50/80"
                >
                  <p
                    class="text-xs font-semibold tracking-wide uppercase text-oceanBlue"
                  >
                    Focus when revisiting
                  </p>
                  <p class="mt-2 text-sm leading-6 text-slate-700">
                    {{ recommendation.attainmentFocus }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2 mt-4">
                  <span
                    class="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700"
                  >
                    Progress {{ recommendation.progressPercent }}%
                  </span>
                  <span
                    v-if="recommendation.assessmentScore !== null"
                    class="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700"
                  >
                    Quiz {{ recommendation.assessmentScore }}%
                  </span>
                  <span
                    v-for="reasonCode in recommendation.reasonCodes"
                    :key="reasonCode"
                    class="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800"
                  >
                    {{ formatReasonCode(reasonCode) }}
                  </span>
                </div>
              </div>

              <div
                class="flex items-center gap-2 text-sm font-semibold text-oceanBlue group-hover:text-deepBlue"
              >
                <span>{{
                  formatRecommendationActionHelper(
                    recommendation.recommendedAction,
                  )
                }}</span>
                <Icon
                  name="heroicons:arrow-right-20-solid"
                  class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
            </div>
          </NuxtLink>

          <div
            class="flex flex-col gap-3 px-5 py-4 border-t border-slate-200 bg-white sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-sm text-slate-500">
              Open the topic directly or ask AI Teacher to guide your revision.
            </p>

            <div class="flex flex-col gap-3 sm:flex-row">
              <NuxtLink
                :to="recommendation.revisitPath"
                class="inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-colors border rounded-xl border-oceanBlue/20 text-oceanBlue hover:bg-oceanBlue/5"
              >
                <Icon
                  name="heroicons:play-circle"
                  class="w-5 h-5"
                />
                <span>Open Compitence</span>
              </NuxtLink>

              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white transition-colors rounded-xl bg-oceanBlue hover:bg-deepBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40"
                @click="openAiTeacherWithPrompt(recommendation.seedPrompt)"
              >
                <Icon
                  name="heroicons:sparkles"
                  class="w-5 h-5"
                />
                <span>Study with AI Teacher</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- Learning Subject Statistics -->
    <div
      class="w-full mx-auto my-4 overflow-hidden bg-white rounded-md shadow-md"
      v-if="profileData?.recentTopics?.length > 0"
    >
      <div class="px-6 py-4 bg-gradient-to-r from-deepBlue to-oceanBlue">
        <h3 class="text-lg font-semibold text-white">
          Learning Topics Statistics
        </h3>
      </div>
      <div
        class="grid w-full grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-5"
      >
        <HomeTopicCard
          v-for="topic in profileData.recentTopics"
          :key="topic?._id"
          :topic-id="topic?._id"
          :topic-image="topic?.thumbnail"
          :topic-title="topic?.name"
          :topic-description="topic?.descriptions"
          :topic-duration="
            topic?.topic_duration ? topic?.topic_duration : '10 min'
          "
          :topic-likes="topic?.topic_likes ? topic?.topic_likes : 100"
          :topic-views="
            topic?.viewedBy?.length
              ? topic?.viewedBy?.length
              : topic?.views
                ? topic?.views
                : 0
          "
          topic-level="lower secondary"
          :topic-standard="topic?.level?.name"
          :subject-name="topic?.subject?.name"
          :topic-viewed="topic?.isViewed"
          :topic-progress="topic?.progress?.avgProgress"
          model-type="profile"
        />
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

                <CustomDropDownList
                  id="region"
                  name="region"
                  v-model="profile.region"
                  :list="regionOptions"
                  :placeholder="regionPlaceholder"
                  @update-model-value="
                    (value: string) => {
                      profile.region = value;
                      onValueChanged('region');
                    }
                  "
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                />
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

                <CustomDropDownList
                  id="district"
                  name="district"
                  v-model="profile.district"
                  :list="districtOptions"
                  :placeholder="districtPlaceholder"
                  @update-model-value="
                    (value: string) => {
                      profile.district = value;
                      onValueChanged('district');
                    }
                  "
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                />
              </div>
            </div>

            <!-- School -->
            <div
              class="relative group"
              v-if="profile.type.toLowerCase() !== 'educationstakeholder'"
            >
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

                <CustomDropDownList
                  id="school"
                  name="school"
                  v-model="profile.school"
                  :list="schoolOptions"
                  :placeholder="schoolPlaceholder"
                  @update-model-value="
                    (value: string) => {
                      profile.school = value;
                      onValueChanged('school');
                    }
                  "
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                />
              </div>
            </div>

            <div
              class="relative group"
              v-if="
                !['teacher', 'educationstakeholder'].includes(
                  profile.type.toLowerCase(),
                )
              "
            >
              <label
                for="level"
                class="block mb-1 ml-1 text-xs font-medium text-textGray"
              >
                Level
              </label>

              <div class="relative flex items-center">
                <!-- Use the Custom Dropdown instead of <select> -->
                <CustomDropDownList
                  v-model="profile.level"
                  :list="levelsLists"
                  placeholder="(eg: Form 1, Form 2 ...)"
                  @update-model-value="
                    (value: string) => {
                      profile.level = value;
                      onValueChanged('level');
                    }
                  "
                  button-class="py-3 pl-10 pr-3 transition-all duration-500 border rounded-lg border-textGray text-textGray bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-deepBlue"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <Transition name="fade">
      <div
        class="flex items-center justify-between w-full gap-4 mt-8"
        v-if="isModified"
      >
        <!-- Discard Changes -->
        <button
          type="reset"
          @click="discardChanges"
          class="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium transition-colors duration-500 ease-in-out border-2 rounded-md hover:text-white text-deepBlue border-oceanBlue hover:bg-gradient-to-r from-deepBlue to-oceanBlue hover:shadow-md"
        >
          Discard Changes
          <Icon
            name="heroicons:arrow-right"
            class="w-4 h-4"
          />
        </button>

        <!-- save Changes -->
        <button
          type="submit"
          @click="updatedProfile()"
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
        >
          <div
            class="flex items-center justify-center gap-4"
            v-if="profile.controller.status === 'loading'"
          >
            <span>Please Wait...</span>
            <IconsLoading
              class="text-white"
              :size="20"
            />
          </div>

          <div
            class="flex items-center justify-center gap-4"
            v-else-if="profile.controller.status === 'success'"
          >
            <span>Changes Saved Successfully!</span>
            <IconsChecked
              class="text-white"
              :size="20"
            />
          </div>

          <div
            class="flex items-center justify-center gap-4"
            v-else-if="profile.controller.feedback === 'error'"
          >
            <span>Changes Failed to Save!</span>
            <IconsCrossCircle
              class="text-white"
              :size="20"
            />
          </div>

          <div
            class="flex items-center justify-center gap-4"
            v-else
          >
            Save Changes
            <Icon
              name="heroicons:arrow-right"
              class="w-4 h-4"
            />
          </div>
        </button>
      </div>
    </Transition>
  </div>
  <div
    v-else-if="status == 'error'"
    class="flex items-center justify-center w-full max-w-7xl'"
  >
    <MessagePageNotFound />
  </div>
  <div
    v-else
    class="flex items-center justify-center w-full max-w-7xl'"
  >
    <p class="text-center text-medium">
      Try to refresh the page, Something went Wrong
    </p>
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
