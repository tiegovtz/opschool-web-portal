<script setup lang="ts">
import { sanitize } from "~/utilities/sanitizeInput";
import { auth } from "~/utilities/validationInput";
import { generateRandomID } from "~/utilities/generateRandomNumber";
import apiDocs from "~/utilities/apiDocs";
import {
  educationLevelNameToLevelsApiQuery,
} from "~/utilities/educationLevelApiMaps";
import { CustomDropDownList } from "#components";
import type { Level } from "~/types/level.interface";
import type { educationLevel } from "~/types/educationlevel.interface";
import type { FetchError } from "ofetch";

// input tabs control
const inputTabs = ref("tabOne");
const headingRef = ref<HTMLElement | null>(null);
const listLevel = ref<Level[]>([]);
const listEducationLevels = ref<educationLevel[]>([]);
const classLevel = ref<string>('');
const route = useRoute();
const authLanguage = useAuthPageLanguage();
const isSwahili = computed(() => authLanguage.value === "kiswahili");
const content = computed(() => ({
  title: isSwahili.value ? "Jisajili" : "Sign Up",
  homeLinkAria: isSwahili.value
    ? "Bonyeza kurudi nyumbani. Kiungo hiki kina nembo ya TET."
    : "Press to go home. The link contain TIE logo",
  userTypeLabel: isSwahili.value ? "Chagua aina ya mtumiaji:" : "Select User Type:",
  userTypePlaceholder: isSwahili.value ? "(mfano: Mwanafunzi, Mwalimu ...)" : "(eg: Student, Teacher ...)",
  firstNamePlaceholder: isSwahili.value ? "Jina la kwanza" : "First Name",
  lastNamePlaceholder: isSwahili.value ? "Jina la mwisho" : "Last Name",
  educationLevelLabel: isSwahili.value ? "Chagua ngazi ya elimu:" : "Select Education Level:",
  educationLevelPlaceholder: isSwahili.value ? "(mfano: Msingi, Sekondari ...)" : "(eg: Secondary, Primary ...)",
  classLevelLabel: isSwahili.value ? "Ngazi ya darasa:" : "Class Level:",
  classLevelPlaceholder: isSwahili.value ? "(mfano: Darasa la Kwanza ...)" : "(eg: Baraa Secondary School ...)",
  sexLabel: isSwahili.value ? "Chagua jinsia:" : "Select Sex:",
  male: isSwahili.value ? "Mwanaume" : "Male",
  female: isSwahili.value ? "Mwanamke" : "Female",
  alreadyHaveAccount: isSwahili.value ? "Tayari una akaunti?" : "Already have an account?",
  signIn: isSwahili.value ? "Ingia" : "Sign In",
  next: isSwahili.value ? "Endelea" : "Next",
  ageLabel: isSwahili.value ? "Chagua umri:" : "Select Age:",
  ageStudentPlaceholder: isSwahili.value ? "Mfano: Watoto (3 - 12)" : "Eg: kids(3 - 12)",
  ageOtherPlaceholder: isSwahili.value ? "Mfano: Vijana watu wazima (20 - 35)" : "Eg: YoungAdults(20 - 35)",
  emailPlaceholder: isSwahili.value ? "Barua pepe (mfano: example@email.com)" : "Email (eg: example@email.com)",
  phonePlaceholder: isSwahili.value ? "Namba ya simu (mfano: 0622***722 au +255622***722)" : "Phone Number (eg: 0622***722 or +255622***722)",
  organizationPlaceholder: isSwahili.value ? "Taasisi/Shirika (mfano: Ekima Interactive Company)" : "Organization (eg: Ekima interctive company)",
  organizationRoleLabel: isSwahili.value ? "Chagua jukumu lako katika taasisi:" : "Select role in your Organization:",
  organizationRolePlaceholder: isSwahili.value ? "Mfano: Meneja" : "Eg: ( Manager ) ...",
  otherRolePlaceholder: isSwahili.value ? "Tafadhali eleza jukumu lako katika taasisi" : "Please specify role in your organization",
  usernameLabel: isSwahili.value ? "Jina la mtumiaji:" : "Username:",
  usernamePlaceholder: isSwahili.value ? "Jina la mtumiaji (mfano: Baraka.Minja)" : "Username (eg: Baraka.Minja)",
  passwordPlaceholder: isSwahili.value ? "Nenosiri" : "Password",
  confirmPasswordPlaceholder: isSwahili.value ? "Thibitisha nenosiri" : "Confirm Password",
  submitted: isSwahili.value ? "Imewasilishwa" : "Submitted",
  signingUp: isSwahili.value ? "Inajisajili, tafadhali subiri." : "Signing up, please wait.",
  failed: isSwahili.value ? "Imeshindikana" : "Failed",
  internalError: isSwahili.value ? "Hitilafu ya ndani" : "Internal Error",
  signUp: isSwahili.value ? "Jisajili" : "Sign Up",
  back: isSwahili.value ? "Rudi" : "Back",
  liveSigningUp: isSwahili.value ? "Inajisajili, tafadhali subiri." : "Signing up, please wait.",
  feedback: {
    registered: isSwahili.value ? "Akaunti imefunguliwa. Tafadhali ingia." : "Account successfully created, Please login",
    userExists: isSwahili.value ? "Jina hili la mtumiaji tayari linatumika. Tafadhali chagua jingine." : "This username is already in use. Please choose another.",
    accountExists: isSwahili.value ? "Akaunti yenye barua pepe hii tayari ipo." : "An account with this email already exists",
    badRequest: isSwahili.value ? "Ombi si sahihi. Tafadhali hakiki taarifa zako." : "Bad request. Please check your input.",
    unauthorized: isSwahili.value ? "Huna ruhusa. Tafadhali ingia." : "Unauthorized access. Please log in.",
    forbidden: isSwahili.value ? "Umezuiwa kufanya kitendo hiki." : "Forbidden. You do not have permission.",
    notFound: isSwahili.value ? "Rasilimali uliyoomba haikupatikana." : "Requested resource not found.",
    emailExists: isSwahili.value ? "Barua pepe hii tayari ipo." : "This email already exists.",
    phoneExists: isSwahili.value ? "Namba hii ya simu tayari imesajiliwa." : "This phone number is already registered.",
    usernameTaken: isSwahili.value ? "Jina hili la mtumiaji tayari limechukuliwa." : "This username is already taken.",
    unexpected: isSwahili.value ? "Hitilafu isiyotegemewa imetokea. Tafadhali jaribu tena." : "An unexpected error occurred. Please try again.",
    internalServer: isSwahili.value ? "Hitilafu ya ndani ya seva. Tafadhali jaribu tena baadaye." : "Internal server error. Please try again later.",
    serviceUnavailable: isSwahili.value ? "Huduma haipatikani kwa sasa. Seva haifanyi kazi." : "Service unavailable. Server is currently down.",
    noResponse: isSwahili.value ? "Hakuna majibu kutoka kwa seva. Tafadhali angalia muunganisho wa intaneti." : "No response from the server. Please check your internet connection.",
    requestFailed: isSwahili.value ? "Ombi limeshindwa kutokana na hitilafu isiyojulikana." : "Request failed due to an unknown error.",
    serverInternal: isSwahili.value ? "Hitilafu ya ndani ya seva." : "Internal server error",
  },
  errors: {
    age: isSwahili.value ? "Umri unahitajika" : "Age is required",
    confirmPassword: isSwahili.value ? "Manenosiri hayafanani" : "Password Mismatch",
    invalidEmail: isSwahili.value ? "Tafadhali weka barua pepe sahihi" : "Please enter a valid email address",
    firstName: isSwahili.value ? "Jina la kwanza linapaswa kuwa na angalau herufi tatu" : "First Name should have at least three characters",
    gender: isSwahili.value ? "Jinsia ya mtumiaji inahitajika" : "User gender is required",
    lastName: isSwahili.value ? "Jina la mwisho linapaswa kuwa na angalau herufi tatu" : "Last Name should have at least three characters",
    passwordMinLength: isSwahili.value ? "Angalau herufi 6" : "At least 6 characters",
    invalidPhone: isSwahili.value ? "Tafadhali weka namba sahihi ya simu" : "Please enter a valid phone number",
    region: isSwahili.value ? "Mkoa unahitajika" : "Region is required",
    userType: isSwahili.value ? "Aina ya mtumiaji inahitajika" : "User role is required",
    educationLevel: isSwahili.value ? "Ngazi ya elimu inahitajika" : "Education level is required",
    classLevel: isSwahili.value ? "Darasa linahitajika" : "Class level is required",
    role: isSwahili.value ? "Jukumu linahitajika" : "Role is required",
    organization: isSwahili.value ? "Taasisi/Shirika linahitajika" : "Organization is required",
    otherRole: isSwahili.value ? "Tafadhali eleza jukumu lako" : "Please specify your role",
    invalidUserName: isSwahili.value ? "Jina la mtumiaji si sahihi. Hakikisha linafuata muundo unaotakiwa." : "Invalid username. Ensure it meets the required format.",
    nameMinLength: isSwahili.value ? "Jina lazima liwe na angalau herufi 3" : " Name must be at least 3 characters long",
    nameSpecialChars: isSwahili.value ? "Jina lisitumie alama maalum au namba" : "Name should not contain special characters or numbers",
    nameRepeatedChars: isSwahili.value ? "Jina lisiwe na herufi tatu au zaidi zinazojirudia" : "Name should not have three or more repeating characters",
    school: isSwahili.value ? "Shule inahitajika" : "School is required",
    district: isSwahili.value ? "Wilaya inahitajika" : "District is required",
  },
  userTypes: {
    student: isSwahili.value ? "Mwanafunzi" : "Student",
    teacher: isSwahili.value ? "Mwalimu" : "Teacher",
    stakeholder: isSwahili.value ? "Mdau wa Elimu" : "Education Stakeholder",
  },
  ageGroups: {
    child: isSwahili.value ? "Watoto (3 - 12)" : "Kids (3 - 12)",
    teen: isSwahili.value ? "Vijana balehe (13 - 19)" : "Teens (13 - 19)",
    youngAdult: isSwahili.value ? "Vijana watu wazima (20 - 35)" : "Young Adults (20 - 35)",
    middleAgedAdult: isSwahili.value ? "Watu wazima wa kati (36 - 60)" : "Middle-Aged Adults (36 - 60)",
    adult: isSwahili.value ? "Watu wazima (60+)" : "Adults (60+)",
  },
  organizationRoles: {
    researcher: isSwahili.value ? "Mtafiti" : "Reseacher",
    schoolAdminOwner: isSwahili.value ? "Msimamizi/Mmiliki wa shule" : "School Admin | Owner",
    schoolManager: isSwahili.value ? "Meneja wa shule" : "School Manager",
    educationalist: isSwahili.value ? "Mtaalamu wa elimu" : "Educationalist",
    others: isSwahili.value ? "Nyingine" : "others",
  },
}));

const authRedirectQuery = computed(() =>
  typeof route.query.redirect === "string" && route.query.redirect.length > 0
    ? { redirect: route.query.redirect }
    : {}
);

type userType = 'Student' | 'Teacher' | 'EducationStakeholder';

interface userSignUp {
  type: userType | string;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  userName: string | null;
  age: string;
  region: string;
  educationLevel: string;
  school: string;
  district: string;
  organization: string | null;
  userOrgRole: string;
  otherRole: string | null;
  password: string | null;
  confirm_password: string | null;
  controller: {
    userExists: boolean;
    isSubmitted: boolean;
    feedback: string | null;
    isSent: string | null;
    errors: {
      all: string | null;
      type: string | null;
      fname: string | null;
      lname: string | null;
      userName: string | null;
      email: string | null;
      phone: string | null;
      gender: string | null;
      age: string | null;
      region: string | null;
      password: string | null;
      confirm_password: string | null;
      educationLevel: string | null;
      classLevel: string | null;
      school: string | null;
      district: string | null;
      organization: string | null;
      userOrgRole: string | null;
      otherRole: string | null;
      userExist: string | null;
    }
  }
}

// List
const levelsLists = computed(() =>
  (listLevel.value ?? []).map((level) => ({ id: level._id, name: level.name }))
)


const educationLevelLists = computed(() =>
  (listEducationLevels.value ?? []).map((level) => ({ id: level._id, name: level.name }))
)

const usersignUp = reactive<userSignUp>({
  type: "",
  fname: null,
  lname: null,
  email: null,
  phone: null,
  gender: null,
  userName: null,
  age: "",
  region: "",
  educationLevel: "",
  school: "",
  district: "",
  organization: null,
  userOrgRole: '',
  otherRole: null,
  password: null,
  confirm_password: null,
  controller: {
    userExists: false,
    isSubmitted: false,
    feedback: null,
    isSent: null,
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
      educationLevel: null,
      classLevel: null,
      school: null,
      district: null,
      organization: null,
      userOrgRole: null,
      otherRole: null,
      userExist: null,
    },
  },
});

const normalizeUserTypeKey = (type: string) => {
  const value = (type || "").toString().trim().replace(/\s+/g, "") as userType;
  return value;
};

const normalizedUserType = computed(() => normalizeUserTypeKey(usersignUp.type));
const isStudent = computed(() => normalizedUserType.value === "Student");
const isStudentOrTeacher = computed(() =>
  ["Student", "Teacher"].includes(normalizedUserType.value)
);
const isStakeholder = computed(() => normalizedUserType.value === "EducationStakeholder");
const requiresEducationLevel = computed(() => isStudentOrTeacher.value);
const requiresClassLevel = computed(() => isStudent.value);
const requiresSchoolSelection = computed(() => isStudentOrTeacher.value);
const requiresContactInfo = computed(() =>
  ["Teacher", "EducationStakeholder"].includes(normalizedUserType.value),
);
const resolvedStakeholderRole = computed(() =>
  usersignUp.userOrgRole.toLowerCase().trim() === "others"
    ? (usersignUp.otherRole || "").trim()
    : (usersignUp.userOrgRole || "").trim(),
);

watch(
  () => usersignUp.educationLevel,
  async (id) => {
    usersignUp.school = "";
    classLevel.value = "";
    const trimmed = (id || "").toString().trim();
    usersignUp.controller.errors.educationLevel = trimmed
      ? null
      : usersignUp.controller.errors.educationLevel;
    usersignUp.controller.errors.classLevel = null;
    if (!trimmed) {
      listLevel.value = [];
      return;
    }
    const row = listEducationLevels.value.find((e) => e._id === trimmed);
    if (!row?.name) {
      listLevel.value = [];
      return;
    }
    const educationLevelParam = educationLevelNameToLevelsApiQuery(row.name);
    try {
      const response = await $fetch<Level[]>(apiDocs.levels.getLevels, {
        method: "GET",
        query: { educationLevel: educationLevelParam },
      });
      listLevel.value = response ?? [];
    } catch (error) {
      console.error("Error fetching levels for education level:", error);
      listLevel.value = [];
    }
  }
);

const toBackendUserType = (type: string) => {
  const key = normalizeUserTypeKey(type);
  if (key === "Student") return "Student";
  if (key === "Teacher") return "Teacher";
  if (key === "EducationStakeholder") return "EducationStakeholder";
  return type?.toString().trim() || "";
};

const getEducationLevels = async () => {
  try {
    const response = await $fetch<educationLevel[]>(apiDocs.educationLevel.getEducationLevels, {
      method: "GET",
    });
    listEducationLevels.value = response;
  } catch (error) {
    console.error("Error fetching education levels:", error);
  }
};

const signUp = async () => {
  const typeKey = normalizeUserTypeKey(usersignUp.type);
  const backendType = toBackendUserType(usersignUp.type);
  const hasBaseFields = Boolean(
    usersignUp.age &&
    usersignUp.confirm_password?.trim() &&
    usersignUp.fname?.trim() &&
    usersignUp.lname?.trim() &&
    usersignUp.gender?.trim() &&
    usersignUp.password?.trim() &&
    usersignUp.password === usersignUp.confirm_password &&
    usersignUp.region?.trim() &&
    usersignUp.type?.trim() &&
    usersignUp.district?.trim(),
  );
  const hasEducationFields = !requiresEducationLevel.value || Boolean(usersignUp.educationLevel?.trim());
  const hasSchoolFields = !requiresSchoolSelection.value || Boolean(usersignUp.school?.trim());
  const hasContactFields = !requiresContactInfo.value || Boolean(usersignUp.email?.trim() && usersignUp.phone?.trim());
  const hasStakeholderFields = !isStakeholder.value || Boolean(usersignUp.organization?.trim() && resolvedStakeholderRole.value);
  const hasStudentLevel = !requiresClassLevel.value || Boolean(classLevel.value?.trim());

  if (
    hasBaseFields &&
    hasEducationFields &&
    hasSchoolFields &&
    hasContactFields &&
    hasStakeholderFields &&
    hasStudentLevel
  ) {

    // 
    usersignUp.controller.isSent = 'pending';
    usersignUp.controller.isSubmitted = true;
    // user role other,

    try {
      const response = await $fetch.raw(apiDocs.auth.signUp, {
        method: "POST",
        body: typeKey == 'Student' ?
          {
            name: sanitize.input(usersignUp.fname + " " + usersignUp.lname),
            password: usersignUp.password,
            type: backendType,
            gender: usersignUp.gender,
            region: usersignUp.region,
            school: usersignUp.school && usersignUp.school.trim() !== '' ? usersignUp.school : null,
            district: usersignUp.district,
            ageGroup: usersignUp.age,
            level: classLevel.value,
            terms: true,
            roles: ['Student'],
            username: usersignUp.userName && usersignUp.userName.trim() !== '' ? usersignUp.userName : null,
          }
          :
          typeKey == 'Teacher' ?

            {
              name: sanitize.input(usersignUp.fname + " " + usersignUp.lname),
              password: usersignUp.password,
              phoneNumber: usersignUp.phone ? sanitize.input(usersignUp.phone[0] == '0' ? String(usersignUp.phone).slice(1) : String(usersignUp.phone).slice(4)) : null,
              type: backendType,
              email: usersignUp.email ? sanitize.input(usersignUp.email) : null,
              gender: usersignUp.gender,
              region: usersignUp.region,
              roles: ['Teacher'],
              school: usersignUp.school && usersignUp.school.trim() !== '' ? usersignUp.school : null,
              district: usersignUp.district,
              ageGroup: usersignUp.age,
              terms: true,
            }
            :
            {
              name: sanitize.input(usersignUp.fname + " " + usersignUp.lname),
              password: usersignUp.password,
              phoneNumber: usersignUp.phone ? sanitize.input(usersignUp.phone[0] == '0' ? String(usersignUp.phone).slice(1) : String(usersignUp.phone).slice(4)) : null,
              type: backendType,
              email: usersignUp.email ? sanitize.input(usersignUp.email) : null,
              gender: usersignUp.gender,
              region: usersignUp.region,
              school: usersignUp.school && usersignUp.school.trim() !== '' ? usersignUp.school : null,
              district: usersignUp.district,
              ageGroup: usersignUp.age,
              roles: ['EducationStakeholder'],
              terms: true,
              organization: usersignUp.organization,
              stakeholder: resolvedStakeholderRole.value || null,
            }
      });

      if (response.status >= 200 && response.status < 300) {
        usersignUp.controller.isSent = 'success';
        usersignUp.controller.feedback = content.value.feedback.registered;

        // Navigate to auth page
        const router = useRouter()
        router.push({ path: '/auth', query: { ...authRedirectQuery.value, registered: '1' } });

      } else {
        usersignUp.controller.isSent = 'failed';

        // Check both student and Stakeholder and teacher already Exist
        if (typeKey === 'Student') {
          usersignUp.controller.feedback = content.value.feedback.userExists;
        } else {
          usersignUp.controller.feedback = content.value.feedback.accountExists;
        }
      }
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      usersignUp.controller.isSent = 'error';
      const errorMessage = JSON.stringify(fetchError?.response?._data?.errors ?? fetchError?.data?.errors);
      const status = fetchError?.response?.status ?? fetchError?.status;
      if (status) {
        // The request was made, but the server responded with a status code
        switch (status) {
          case 400:
            usersignUp.controller.feedback = content.value.feedback.badRequest;
            break;
          case 401:
            usersignUp.controller.feedback = content.value.feedback.unauthorized;
            break;
          case 403:
            usersignUp.controller.feedback = content.value.feedback.forbidden;
            break;
          case 404:
            usersignUp.controller.feedback = content.value.feedback.notFound;
            break;
          case 422:
            if (errorMessage.includes('email')) {
              usersignUp.controller.feedback = content.value.feedback.emailExists;
            } else if (errorMessage.includes('phone')) {
              usersignUp.controller.feedback = content.value.feedback.phoneExists;
            } else if (errorMessage.includes('username')) {
              usersignUp.controller.feedback = content.value.feedback.usernameTaken;
            } else {
              usersignUp.controller.feedback = content.value.feedback.unexpected;
            }
            break;
          case 500:
            usersignUp.controller.feedback = content.value.feedback.internalServer;
            break;
          case 503:
            usersignUp.controller.feedback = content.value.feedback.serviceUnavailable;
            break;
          default:
            usersignUp.controller.feedback = content.value.feedback.unexpected;
        }
      } else if (fetchError?.request) {
        // The request was made but no response was received
        usersignUp.controller.feedback = content.value.feedback.noResponse;
      } else {
        // Something else went wrong in setting up the request
        usersignUp.controller.feedback = content.value.feedback.requestFailed;
      }
    }

    // Keep success feedback while we redirect to /auth; clear only for non-success flows
    if (usersignUp.controller.isSent !== 'success') {
      usersignUp.controller.isSent = null;
      usersignUp.controller.feedback = null;
    }

  } else {
    usersignUp.controller.isSubmitted = false;

    if (!usersignUp.age) {
      usersignUp.controller.errors.age = content.value.errors.age;
    }
    if (!usersignUp.confirm_password) {
      usersignUp.controller.errors.confirm_password = content.value.errors.confirmPassword;
    }
    if (requiresContactInfo.value && !usersignUp.email) {
      usersignUp.controller.errors.email = content.value.errors.invalidEmail;
    }
    if (!usersignUp.fname) {
      usersignUp.controller.errors.fname = content.value.errors.firstName;
      switchTab("tabOne");
    }
    if (!usersignUp.gender) {
      usersignUp.controller.errors.gender = content.value.errors.gender;
      switchTab("tabOne");
    }
    if (!usersignUp.lname) {
      usersignUp.controller.errors.lname = content.value.errors.lastName;
      switchTab("tabOne");
    }
    if (!usersignUp.password) {
      usersignUp.controller.errors.password = content.value.errors.passwordMinLength;
    }
    if (requiresContactInfo.value && !usersignUp.phone) {
      usersignUp.controller.errors.phone = content.value.errors.invalidPhone;
    }
    if (!usersignUp.region) {
      usersignUp.controller.errors.region = content.value.errors.region;
    }
    if (!usersignUp.district) {
      usersignUp.controller.errors.district = content.value.errors.district;
    }
    if (!usersignUp.type) {
      usersignUp.controller.errors.type = content.value.errors.userType;
    }

    if (isStakeholder.value && !usersignUp.organization?.trim()) {
      usersignUp.controller.errors.organization = content.value.errors.organization;
    }

    if (isStakeholder.value && !usersignUp.userOrgRole.trim()) {
      usersignUp.controller.errors.userOrgRole = content.value.errors.role;
    }

    if (requiresEducationLevel.value && !usersignUp.educationLevel?.trim()) {
      usersignUp.controller.errors.educationLevel = content.value.errors.educationLevel;
      switchTab("tabOne");
    } else {
      usersignUp.controller.errors.educationLevel = null;
    }

    if (requiresSchoolSelection.value && !usersignUp.school?.trim()) {
      usersignUp.controller.errors.school = content.value.errors.school;
      switchTab("tabOne");
    } else {
      usersignUp.controller.errors.school = null;
    }

    if (requiresClassLevel.value && !classLevel.value?.trim()) {
      usersignUp.controller.errors.classLevel = content.value.errors.classLevel;
      switchTab("tabOne");
    } else {
      usersignUp.controller.errors.classLevel = null;
    }

    if (isStakeholder.value && usersignUp.userOrgRole.toLowerCase().trim() === "others" && !usersignUp.otherRole?.trim()) {
      usersignUp.controller.errors.otherRole = content.value.errors.otherRole;
    } else {
      usersignUp.controller.errors.otherRole = null;
    }
  }
};

// check user exists in records
const userExists = async () => {
  try {
    const response = await $fetch<string>(apiDocs.auth.userExists, {
      method: "POST",
      body: {
        username: usersignUp.userName,
      }
    });

    if (response === 'true') {
      usersignUp.controller.userExists = true;
      usersignUp.controller.errors.userName = content.value.feedback.userExists;

      //Generate randomly number
      usersignUp.userName = usersignUp.fname + "." + usersignUp.lname + generateRandomID();

      userExists();
    } else {
      usersignUp.controller.userExists = false;
      usersignUp.controller.errors.userName = null;
    }
  } catch (error: unknown) {
    const fetchError = error as FetchError;
    usersignUp.controller.userExists = true;
    console.error(fetchError);
    usersignUp.controller.feedback = content.value.feedback.serverInternal;
  }
}

// Watch if user has inset data
watch(
  () => usersignUp.fname,
  (fname) => {
    if (fname) {
      // Validate first name
      const name: any = auth.isValidName(fname);
      if (!name.isMinLength) {
        usersignUp.controller.errors.fname = content.value.errors.nameMinLength;
      } else if (!name.hasNoSpecialChars) {
        usersignUp.controller.errors.fname = content.value.errors.nameSpecialChars;
      } else if (!name.hasNoRepeatedChars) {
        usersignUp.controller.errors.fname = content.value.errors.nameRepeatedChars;
      } else {
        usersignUp.controller.errors.fname = null;
      }
    } else {
      usersignUp.controller.errors.fname = null;
    }
  }
);

// last name watching
watch(
  () => usersignUp.lname,
  (lname) => {
    if (lname) {
      // Validate last name
      const name: any = auth.isValidName(lname);
      if (!name.isMinLength) {
        usersignUp.controller.errors.lname = content.value.errors.nameMinLength;
      } else if (!name.hasNoSpecialChars) {
        usersignUp.controller.errors.lname = content.value.errors.nameSpecialChars;
      } else if (!name.hasNoRepeatedChars) {
        usersignUp.controller.errors.lname = content.value.errors.nameRepeatedChars;
      } else {
        usersignUp.controller.errors.lname = null;
      }
    } else {
      usersignUp.controller.errors.lname = null;
    }
  }
);

// user name watching
watch(
  () => usersignUp.userName,
  (username) => {
    if (username) {
      if (!auth.checkEmailPhoneOrUsername(username)) {
        usersignUp.controller.errors.userName = content.value.errors.invalidUserName;
      }
      else {
        userExists()
      }
    }
    else {
      usersignUp.controller.errors.userName = null
    }
  })

// Email watching
watch(
  () => usersignUp.email,
  (email) => {
    if (email) {
      // Validate Email
      if (auth.isValidEmail(email)) {
        usersignUp.controller.errors.email = null;
      } else {
        usersignUp.controller.errors.email = content.value.errors.invalidEmail;
      }
    } else {
      usersignUp.controller.errors.email = null;
    }
  }
);

// Phone watching
watch(
  () => usersignUp.phone,
  (phone) => {
    if (phone) {
      // Validate Phone
      if (auth.isValidPhone(phone)) {
        usersignUp.controller.errors.phone = null;
      } else {
        usersignUp.controller.errors.phone = content.value.errors.invalidPhone;
      }
    } else {
      usersignUp.controller.errors.phone = null;
    }
  }
);

// type watching
watch(
  () => usersignUp.type,
  (type) => {
    // Validate type
    if (type) {
      usersignUp.controller.errors.type = null;
    } else {
      usersignUp.controller.errors.type = content.value.errors.userType;
    }

    if (normalizeUserTypeKey(type) !== "EducationStakeholder") {
      usersignUp.organization = null;
      usersignUp.otherRole = null;
      usersignUp.userOrgRole = "";
      usersignUp.controller.errors.organization = null;
      usersignUp.controller.errors.userOrgRole = null;
      usersignUp.controller.errors.otherRole = null;
    }

    if (normalizeUserTypeKey(type) === "EducationStakeholder") {
      usersignUp.educationLevel = "";
      usersignUp.school = "";
      classLevel.value = "";
      listLevel.value = [];
      usersignUp.controller.errors.educationLevel = null;
      usersignUp.controller.errors.school = null;
      usersignUp.controller.errors.classLevel = null;
    }

    if (normalizeUserTypeKey(type) !== "Student") {
      usersignUp.userName = null;
      classLevel.value = "";
      usersignUp.controller.errors.userName = null;
      usersignUp.controller.errors.classLevel = null;
    }

    if (normalizeUserTypeKey(type) === "Student") {
      usersignUp.email = null;
      usersignUp.phone = null;
      usersignUp.controller.errors.email = null;
      usersignUp.controller.errors.phone = null;
    }
  }
);

// Region watching
watch(
  () => usersignUp.region,
  (region) => {
    // Validate Region
    if (region) {
      usersignUp.controller.errors.region = null;
    } else {
      usersignUp.controller.errors.region = content.value.errors.region;
    }
  }
);

watch(
  () => usersignUp.district,
  (district) => {
    if (district) {
      usersignUp.controller.errors.district = null;
    } else {
      usersignUp.controller.errors.district = content.value.errors.district;
    }
  },
);

watch(
  () => usersignUp.educationLevel,
  (educationLevel) => {
    if (!requiresEducationLevel.value) {
      usersignUp.controller.errors.educationLevel = null;
      return;
    }

    if (educationLevel) {
      usersignUp.controller.errors.educationLevel = null;
    } else {
      usersignUp.controller.errors.educationLevel = content.value.errors.educationLevel;
    }
  },
);

watch(
  classLevel,
  (value) => {
    if (!requiresClassLevel.value) {
      usersignUp.controller.errors.classLevel = null;
      return;
    }

    if (value) {
      usersignUp.controller.errors.classLevel = null;
    } else {
      usersignUp.controller.errors.classLevel = content.value.errors.classLevel;
    }
  },
);

// Age watching
watch(
  () => usersignUp.age,
  (age) => {
    // Validate Region
    if (age) {
      usersignUp.controller.errors.age = null;
    } else {
      usersignUp.controller.errors.age = content.value.errors.age;
    }
  }
);

// genger watching
watch(
  () => usersignUp.gender,
  (gender) => {
    // Validate Gender
    if (gender) {
      usersignUp.controller.errors.gender = null;
    } else {
      usersignUp.controller.errors.gender = content.value.errors.gender;
    }
  }
);

// School watching
watch(
  () => usersignUp.school, (school) => {
    if (!requiresSchoolSelection.value) {
      usersignUp.controller.errors.school = null;
    } else if (school) {
      usersignUp.controller.errors.school = null;
    } else {
      usersignUp.controller.errors.school = content.value.errors.school;
    }
  }
);

watch(
  () => usersignUp.organization,
  (organization) => {
    if (!isStakeholder.value) {
      usersignUp.controller.errors.organization = null;
    } else if (organization?.trim()) {
      usersignUp.controller.errors.organization = null;
    } else {
      usersignUp.controller.errors.organization = content.value.errors.organization;
    }
  },
);

watch(
  () => usersignUp.userOrgRole,
  (role) => {
    if (!isStakeholder.value) {
      usersignUp.controller.errors.userOrgRole = null;
      usersignUp.controller.errors.otherRole = null;
      return;
    }

    if (role?.trim()) {
      usersignUp.controller.errors.userOrgRole = null;
      if (role.toLowerCase().trim() !== "others") {
        usersignUp.controller.errors.otherRole = null;
      }
    } else {
      usersignUp.controller.errors.userOrgRole = content.value.errors.role;
    }
  },
);

watch(
  () => usersignUp.otherRole,
  (role) => {
    if (!isStakeholder.value || usersignUp.userOrgRole.toLowerCase().trim() !== "others") {
      usersignUp.controller.errors.otherRole = null;
    } else if (role?.trim()) {
      usersignUp.controller.errors.otherRole = null;
    } else {
      usersignUp.controller.errors.otherRole = content.value.errors.otherRole;
    }
  },
);

// password watching
watch(
  () => usersignUp.password,
  (password) => {
    // Validate Password
    if (password) {
      if (password.length < 6) {
        usersignUp.controller.errors.password = content.value.errors.passwordMinLength;
      } else {
        usersignUp.controller.errors.password = null;
      }
    } else {
      usersignUp.controller.errors.password = null;
    }
  }
);

// confirm password watching
watch(
  () => usersignUp.confirm_password,
  (confirmPassword) => {
    if (confirmPassword) {
      if (usersignUp.confirm_password !== usersignUp.password) {
        usersignUp.controller.errors.confirm_password = content.value.errors.confirmPassword;
      } else {
        usersignUp.controller.errors.confirm_password = null;
      }
    } else {
      usersignUp.controller.errors.confirm_password = null;
    }
  }
);

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

// input tabs control
const switchTab = (tabName: string) => {
  if (tabName === "tabTwo") {

    if (!usersignUp.type || usersignUp.type.trim() === " ") {
      usersignUp.controller.errors.type = content.value.errors.userType;
    }
    if (!usersignUp.fname || usersignUp.fname.trim() == " ") {
      usersignUp.controller.errors.fname = content.value.errors.firstName;
    }
    if (!usersignUp.lname || usersignUp.lname.trim() == " ") {
      usersignUp.controller.errors.lname = content.value.errors.lastName;
    }

    if (!usersignUp.gender || usersignUp.gender.trim() == " ") {
      usersignUp.controller.errors.gender = content.value.errors.gender;
    }

    if (!usersignUp.region || usersignUp.region.trim() == " ") {
      usersignUp.controller.errors.region = content.value.errors.region;
    }
    if (!usersignUp.district || usersignUp.district.trim() == " ") {
      usersignUp.controller.errors.district = content.value.errors.district;
    }

    if (requiresEducationLevel.value && (!usersignUp.educationLevel || usersignUp.educationLevel.trim() === "")) {
      usersignUp.controller.errors.educationLevel = content.value.errors.educationLevel;
      return;
    }

    if (requiresSchoolSelection.value && (!usersignUp.school || usersignUp.school.trim() == " ")) {
      usersignUp.controller.errors.school = content.value.errors.school;
      return;
    }

    if (requiresClassLevel.value && !classLevel.value.trim()) {
      usersignUp.controller.errors.classLevel = content.value.errors.classLevel;
      return;
    }

    if (
      usersignUp.type &&
      usersignUp.fname &&
      usersignUp.lname &&
      usersignUp.gender &&
      usersignUp.region &&
      usersignUp.district &&
      (!requiresEducationLevel.value || usersignUp.educationLevel) &&
      (!requiresSchoolSelection.value || usersignUp.school) &&
      (!requiresClassLevel.value || classLevel.value)
    ) {

      // Validate first name
      const fname: any = auth.isValidName(usersignUp.fname);
      if (!fname.isMinLength) {
        usersignUp.controller.errors.fname = content.value.errors.nameMinLength;
        return;
      } else if (!fname.hasNoSpecialChars) {
        usersignUp.controller.errors.fname = content.value.errors.nameSpecialChars;
        return;
      } else if (!fname.hasNoRepeatedChars) {
        usersignUp.controller.errors.fname = content.value.errors.nameRepeatedChars;
        return;
      } else {
        usersignUp.controller.errors.fname = null;
      }

      // Validate Last name
      const lname: any = auth.isValidName(usersignUp.lname);
      if (!lname.isMinLength) {
        usersignUp.controller.errors.lname = content.value.errors.nameMinLength;
        return;
      } else if (!lname.hasNoSpecialChars) {
        usersignUp.controller.errors.lname = content.value.errors.nameSpecialChars;
        return;
      } else if (!lname.hasNoRepeatedChars) {
        usersignUp.controller.errors.lname = content.value.errors.nameRepeatedChars;
        return;
      } else {
        usersignUp.controller.errors.lname = null;
      }

      usersignUp.userName = usersignUp.fname + "." + usersignUp.lname;

      // One-liner equivalent to the if statement, use a logical && operator:
      // normalizeUserTypeKey(usersignUp.type) === 'student' && userExists();

      if (usersignUp.type.trim() === 'Student') {
        userExists();
      }

      inputTabs.value = tabName;
    }
  } else if (tabName === "tabOne") {
    inputTabs.value = tabName;
  }
};

// Age Options
const ageOptions = computed(() => {
  const type = usersignUp.type.trim();

  if (type === "Student") {
    return [
      { id: "Child", name: content.value.ageGroups.child },
      { id: "Teen", name: content.value.ageGroups.teen },
      { id: "YoungAdult", name: content.value.ageGroups.youngAdult },
    ];
  }

  return [
    { id: "YoungAdult", name: content.value.ageGroups.youngAdult },
    { id: "MiddleAgedAdult", name: content.value.ageGroups.middleAgedAdult },
    { id: "Adult", name: content.value.ageGroups.adult },
  ];
});

const userTypes = computed(() => [
  { id: 'Student', name: content.value.userTypes.student },
  { id: 'Teacher', name: content.value.userTypes.teacher },
  { id: 'EducationStakeholder', name: content.value.userTypes.stakeholder },
]);

const organization = computed(() => [
  { id: 'Reseacher', name: content.value.organizationRoles.researcher },
  { id: 'School Admin | Owner', name: content.value.organizationRoles.schoolAdminOwner },
  { id: 'School Manager', name: content.value.organizationRoles.schoolManager },
  { id: 'Educationalist', name: content.value.organizationRoles.educationalist },
  { id: 'others', name: content.value.organizationRoles.others },
]);

onMounted(async () => {
  headingRef.value?.focus();

  await getEducationLevels();
});

</script>

<template>
  <div class="flex items-center justify-center min-h-screen py-2 md:bg-gradient-to-b" aria-labelledby="signup-heading"
    tabindex="-1">

    <!-- Message Component -->
    <MessageComponent :message="(usersignUp.controller.feedback as string)"
      :position="usersignUp.controller.feedback ? true : false" :event-type="(usersignUp.controller.isSent as string)"
      :icon="usersignUp.controller.isSent == 'success' ? 'icons8:checked' : 'oui:cross-in-circle-empty'" />

    <div class="w-full max-w-md px-4 py-10 rounded-lg md:bg-white md:shadow-2xl">

      <h1 class="font-bold text-center text-large" id="signup-heading" ref="headingRef" tabindex="-1">{{ content.title }}</h1>

      <NuxtLink to="/" :aria-label="content.homeLinkAria"
        class="w-[100px] h-[100px] mx-auto my-6 flex items-center justify-center">
        <img tabindex="0" src="/logo/logo_tie.gif" class="object-contain w-full h-full"
          alt="An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text ‘Taasisi ya Elimu Tanzania.’ At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text ‘Elimu ni Kazi." />
      </NuxtLink>

      <form @submit.prevent="signUp" @keydown.enter.prevent :class="['text-textGray md:h-[530px] h-dvh relative overflow-hidden text-extraSmall lg:scroll-height lg:overflow-y-scroll no-scrollbar',
        {
          'md:h-[600px]':
            usersignUp.controller.errors.age ||
            usersignUp.controller.errors.fname ||
            usersignUp.controller.errors.gender ||
            usersignUp.controller.errors.lname ||
            usersignUp.controller.errors.password ||
            usersignUp.controller.errors.confirm_password,
        },
        { 'md:h-[650px]': usersignUp.userOrgRole.toLowerCase() === 'others' }
      ]">
        <!-- First Input Group -->
        <div :class="[
          'absolute top-0 flex flex-col px-6 transition-all duration-500 ',
          inputTabs === 'tabOne' ? 'left-0 w-full' : '-left-full'
        ]">
          <!-- Select User Type -->
          <div :class="[
            'mb-2 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.type,
            }
          ]">
            <div class="flex flex-col items-start w-full">
              <label for="type" class="font-semibold capitalize text-oceanBlue text-extraSmall">
                {{ content.userTypeLabel }}</label>

              <!-- Use the Custom Dropdown instead of <select> -->
              <CustomDropDownList v-model="usersignUp.type" :list="userTypes"
                :placeholder="content.userTypePlaceholder"
                @update-model-value="usersignUp.type = $event" />
            </div>

            <!-- Select User Type error message -->
            <small v-if="usersignUp.controller.errors.type" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.type}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.type }}
            </small>
          </div>

          <!-- First Name -->
          <div :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.fname,
            }
          ]">
            <div class="flex items-center w-full">
              <input type="text" id="fname" v-model="usersignUp.fname" @keydown.space.prevent name="fname"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                :placeholder="content.firstNamePlaceholder" />
              <Icon name="lets-icons:user-box-light" class="w-5 h-5 text-textGray" />
            </div>

            <!-- First Name error message -->
            <small v-if="usersignUp.controller.errors.fname" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.fname}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.fname }}
            </small>
          </div>

          <!-- Last Name -->
          <div :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.lname,
            }
          ]">
            <div class="flex items-center w-full">
              <input type="text" id="lname" v-model="usersignUp.lname" @keydown.space.prevent name="lname"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                :placeholder="content.lastNamePlaceholder" />
              <Icon name="lets-icons:user-box-light" class="w-5 h-5 text-textGray" />
            </div>

            <!-- Last Name error message -->
            <small v-if="usersignUp.controller.errors.lname" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.lname}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.lname }}
            </small>
          </div>

          <!-- region -->
          <div :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.region,
            }
          ]">
            <SelectionRegionSelection :error="(usersignUp.controller.errors.region as string)" :language="authLanguage"
              @update-region="usersignUp.region = $event" />
          </div>

          <!-- District -->
          <div :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.district,
            }
          ]">
            <!-- select district -->
            <SelectionDistrictSelection :error="(usersignUp.controller.errors.district as string)"
             :region="usersignUp.region" :language="authLanguage" @update-district="usersignUp.district = $event" />
          </div>

          <!-- education level -->
          <div v-if="isStudentOrTeacher" :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.educationLevel,
            }
          ]">
            <div class="flex flex-col items-start w-full">
              <label for="educationLevel" class="font-semibold capitalize text-oceanBlue text-extraSmall">
                {{ content.educationLevelLabel }}</label>

              <CustomDropDownList id="educationLevel" v-model="usersignUp.educationLevel" :list="educationLevelLists"
                :placeholder="content.educationLevelPlaceholder" @update-model-value="usersignUp.educationLevel = $event" />
            </div>

            <small v-if="usersignUp.controller.errors.educationLevel" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.educationLevel}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.educationLevel }}
            </small>
          </div>

          <!-- school -->
          <div v-if="isStudentOrTeacher" :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.school,
            }
          ]">

            <!-- select school -->
            <SelectionSchoolSelection :district="usersignUp.district" :region="usersignUp.region"
              :school="usersignUp.school" @update-school="usersignUp.school = $event"
              :error="(usersignUp.controller.errors.school as string)" :language="authLanguage" />
          </div>

          <div class="flex flex-col items-start w-full my-2" v-if="usersignUp.type === 'Student'">
            <label for="level" class="font-semibold capitalize text-oceanBlue text-extraSmall">
              {{ content.classLevelLabel }}</label>
            <!-- Use the Custom Dropdown instead of <select> -->
            <CustomDropDownList v-model="classLevel" :list="levelsLists"
              :placeholder="content.classLevelPlaceholder" @update-model-value="classLevel = $event" />
            <small v-if="usersignUp.controller.errors.classLevel" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.classLevel}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.classLevel }}
            </small>
          </div>

          <!-- gender input radio -->
          <div :class="[
            'py-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.gender,
            }
          ]">
            <div class="flex flex-col items-center justify-start md:flex-row md:gap-10">
              <div class="font-semibold capitalize text-oceanBlue text-extraSmall">
                {{ content.sexLabel }}
              </div>

              <div class="flex items-center gap-2" id="gender">
                <div class="flex items-center gap-2">
                  <input type="radio" name="gender" id="male" value="male" v-model="usersignUp.gender"
                    class="w-4 h-4 checked:bg-oceanBlue" />
                  <label for="male" :class="{ 'text-textGray/40': usersignUp.gender !== 'male', }">
                    {{ content.male }}
                  </label>
                </div>
                <div class="flex items-center gap-2">
                  <input type="radio" name="gender" id="female" value="female" v-model="usersignUp.gender"
                    class="w-4 h-4 checked:bg-oceanBlue" />
                  <label for="female" :class="{ 'text-textGray/40': usersignUp.gender !== 'female', }">
                    {{ content.female }}
                  </label>
                </div>
              </div>
            </div>
            <!-- Gender error message -->
            <small v-if="usersignUp.controller.errors.gender" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.gender}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.gender }}
            </small>
          </div>

          <!-- Already have an account -->
          <div class="flex items-center justify-center gap-2 my-2">
            <p class="text-sm text-textGray">
              {{ content.alreadyHaveAccount }}
              <NuxtLink :to="{ path: '/auth', query: authRedirectQuery }" class="w-full p-1 text-center cursor-pointer text-oceanBlue">
                {{ content.signIn }}</NuxtLink>
            </p>
          </div>

          <!-- Next Button -->
          <div class="flex items-center justify-center px-2">
            <button type="button" role="button" tabindex="0" @click="switchTab('tabTwo')"
              class="flex items-center w-auto h-8 gap-2 px-4 transition-all duration-500 border rounded-full cursor-pointer hover:bg-oceanBlue hover:text-white text-oceanBlue border-oceanBlue animate-bounce-horizontal group">
              <p class="text-small group-hover:text-white">{{ content.next }}</p>
              <Icon name="f7:arrow-right" class="group-hover:text-white" size="16" />
            </button>
          </div>
        </div>

        <!-- Second Input Group -->
        <div :class="[
          'absolute top-0 flex flex-col px-6 transition-all duration-500 -right-full',
          inputTabs === 'tabTwo' ? 'right-0 w-full h-full' : ''
        ]">
          <!-- Select Age -->
          <div :class="[
            'flex flex-col mb-3 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.age,
            }
          ]">
            <div class="flex flex-col">
              <label for="age" class="font-semibold capitalize text-oceanBlue text-extraSmall">{{ content.ageLabel }}</label>

              <CustomDropDownList v-model="usersignUp.age" :list="ageOptions" :placeholder="usersignUp.type.trim() === 'Student'
                ? content.ageStudentPlaceholder : content.ageOtherPlaceholder" @update-model-value="usersignUp.age = $event" />
            </div>

            <!-- Age error message -->
            <small v-if="usersignUp.controller.errors.age" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.age}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.age }}
            </small>
          </div>

          <!-- Select email and phone for non student -->
          <div v-if="usersignUp.type !== 'Student'">

            <!-- Email -->
            <div :class="[
              'flex flex-col items-start justify-start gap-2 px-2 mb-3 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
              {
                'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                  usersignUp.controller.errors.email,
              }
            ]">
              <div class="flex items-center w-full">
                <input type="text" id="email" v-model="usersignUp.email" @keydown.space.prevent name="username"
                  autocomplete="off"
                  class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                  :placeholder="content.emailPlaceholder" />
                <Icon name="mdi-light:email" class="w-5 h-5 text-textGray" />
              </div>

              <!-- Email error message -->
              <small v-if="usersignUp.controller.errors.email" aria-live="assertive"
                :aria-label="`${usersignUp.controller.errors.email}`" class="w-full text-red-500 text-smallest">
                {{ usersignUp.controller.errors.email }}
              </small>
            </div>

            <!-- Phone Number -->
            <div :class="[
              'flex flex-col items-start justify-start gap-2 px-2 mb-3 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
              {
                'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                  usersignUp.controller.errors.phone,
              }
            ]">
              <div class="flex items-center w-full">
                <input type="tel" id="phone" v-model="usersignUp.phone" @keydown.space.prevent name="phone"
                  autocomplete="off"
                  class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                  :placeholder="content.phonePlaceholder" />
                <Icon name="iconamoon:phone-thin" class="w-5 h-5 text-textGray" />
              </div>

              <!-- Phone Number error message -->
              <small v-if="usersignUp.controller.errors.phone" aria-live="assertive"
                :aria-label="`${usersignUp.controller.errors.phone}`" class="w-full text-red-500 text-smallest">
                {{ usersignUp.controller.errors.phone }}
              </small>
            </div>

            <!-- organization informations for stakeholders -->
            <div class="" id="organization" v-if="normalizeUserTypeKey(usersignUp.type) === 'EducationStakeholder'">
              <!-- organization name -->
              <div :class="[
                'flex flex-col items-start justify-start gap-2 px-2 mb-3 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                {
                  'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                    usersignUp.controller.errors.organization,
                }
              ]">
                <div class="flex items-center w-full">
                  <input type="text" id="organization" v-model="usersignUp.organization" name="organization"
                    autocomplete="off"
                    class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                    :placeholder="content.organizationPlaceholder" />
                  <Icon name="tdesign:institution" class="w-5 h-5 text-textGray" />
                </div>
                <!-- org name error message -->
                <small v-if="usersignUp.controller.errors.organization" aria-live="assertive"
                  :aria-label="`${usersignUp.controller.errors.organization}`"
                  class="w-full text-red-500 text-smallest">
                  {{ usersignUp.controller.errors.organization }}
                </small>
              </div>

              <!-- stakeholder role -->
              <div :class="[
                'flex flex-col mb-3 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                {
                  'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                    usersignUp.controller.errors.userOrgRole,
                }
              ]">

                <!-- Select Organization -->
                <div class="flex flex-col">
                  <label for="userOrgRole" class="font-semibold capitalize text-oceanBlue text-extraSmall">
                    {{ content.organizationRoleLabel }}</label>

                  <CustomDropDownList v-model="usersignUp.userOrgRole" :list="organization"
                    :placeholder="content.organizationRolePlaceholder" @update-model-value="usersignUp.userOrgRole = $event" />

                </div>

                <!-- Age error message -->
                <small v-if="usersignUp.controller.errors.userOrgRole" aria-live="assertive"
                  :aria-label="`${usersignUp.controller.errors.userOrgRole}`" class="w-full text-red-500 text-smallest">
                  {{ usersignUp.controller.errors.userOrgRole }}
                </small>
              </div>

              <!-- other user role in their org -->
              <div v-if="usersignUp.userOrgRole.toLowerCase() === 'others'" :class="[
                'flex flex-col items-start justify-start gap-2 px-2 mb-3 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
                {
                  'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                    usersignUp.controller.errors.otherRole,
                }
              ]">
                <div class="flex items-center w-full">
                  <input type="text" id="userOrgRole" v-model="usersignUp.otherRole" @keydown.space.prevent
                    name="organization" autocomplete="off"
                    class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                    :placeholder="content.otherRolePlaceholder" />
                  <Icon name="mdi-light:shield" class="w-5 h-5 text-textGray" />
                </div>
                <!-- org name error message -->
                <small v-if="usersignUp.controller.errors.otherRole" aria-live="assertive"
                  :aria-label="`${usersignUp.controller.errors.otherRole}`" class="w-full text-red-500 text-smallest">
                  {{ usersignUp.controller.errors.otherRole }}
                </small>
              </div>
            </div>
          </div>

          <!-- username student -->
          <div v-if="usersignUp.type === 'Student'" :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.userName,
            }
          ]">
            <label class="font-semibold capitalize text-oceanBlue text-extraSmall -ml-2">{{ content.usernameLabel }}</label>
            <div class="flex items-center w-full">
              <input type="text" id="userName" v-model="usersignUp.userName" @keydown.space.prevent name="userName"
                autocomplete="off" readonly
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                :placeholder="content.usernamePlaceholder" />
              <Icon name="lets-icons:user-box-light" class="w-5 h-5 text-textGray" />
            </div>

            <!-- username error message -->
            <small v-if="usersignUp.controller.errors.userName" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.userName}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.userName }}
            </small>
          </div>

          <!-- Password -->
          <div :class="[
            'flex flex-col items-center gap-2 mb-3 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.password,
            }
          ]">
            <div class="flex items-center w-full">
              <input :type="showPassword ? 'text' : 'password'" id="password" v-model="usersignUp.password"
                name="password" autocomplete="off"
                class="w-full p-1 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                :placeholder="content.passwordPlaceholder" />
              <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                class="w-5 h-5 cursor-pointer text-textGray" @click="togglePassword" />
            </div>
            <!-- Password error message -->
            <small v-if="usersignUp.controller.errors.password" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.password }}
            </small>
          </div>

          <!-- Confirm Password -->
          <div
            class="flex flex-col items-center gap-2 mb-3 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue">
            <div class="flex items-center justify-between w-full">
              <input :type="showConfirmPassword ? 'text' : 'password'" id="confirm_password"
                v-model="usersignUp.confirm_password" name="confirm_password" autocomplete="off"
                class="w-full p-1 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                :placeholder="content.confirmPasswordPlaceholder" />
              <Icon :name="showConfirmPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'"
                class="w-5 h-5 cursor-pointer text-textGray" @click="toggleConfirmPassword" />
            </div>
            <!-- Password error message -->
            <small v-if="usersignUp.controller.errors.confirm_password" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.confirm_password}`"
              class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.confirm_password }}
            </small>
          </div>

          <!-- Sign Up Button -->
          <button type="submit" :aria-busy="usersignUp.controller.isSent === 'pending' ? 'true' : 'false'"
            class="w-full p-2 text-white transition-all duration-500 rounded-md cursor-pointer bg-oceanBlue hover:bg-oceanBlue/80">
            <!-- submited successful -->
            <div class="flex items-center justify-center gap-2"
              v-if="usersignUp.controller.isSent === 'success' && usersignUp.controller.isSubmitted">
              {{ content.submitted }}
              <Icon name="icons8:checked" class="w-5 h-5 text-white cursor-pointer" size="16" aria-hidden="true" />
            </div>
            <div class="flex items-center justify-center gap-2"
              v-else-if="usersignUp.controller.isSent === 'pending' && usersignUp.controller.isSubmitted">
              {{ content.signingUp }}
              <Icon name="eos-icons:loading" class="w-5 h-5 text-white cursor-pointer" size="16" aria-hidden="true" />
            </div>

            <div class="flex items-center justify-center gap-2"
              v-else-if="usersignUp.controller.isSent === 'failed' && usersignUp.controller.isSubmitted">
              {{ content.failed }}
              <Icon name="oui:cross-in-circle-empty" class="w-5 h-5 text-white cursor-pointer" size="16"
                aria-hidden="true" />
            </div>
            <div class="flex items-center justify-center gap-2"
              v-else-if="usersignUp.controller.isSent === 'error' && usersignUp.controller.isSubmitted">
              {{ content.internalError }}
              <Icon name="oui:cross-in-circle-empty" class="w-5 h-5 text-white cursor-pointer" size="16"
                aria-hidden="true" />
            </div>
            <div class="flex items-center justify-center gap-2" v-else>
              {{ content.signUp }}
              <Icon name="mynaui:send" class="w-5 h-5 text-white cursor-pointer" size="16" aria-hidden="true" />
            </div>
          </button>
          <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {{ usersignUp.controller.isSent === 'pending' ? content.liveSigningUp : '' }}
          </span>

          <!-- Already have an account -->
          <div class="flex items-center justify-center gap-2 mt-4 mb-4">
            <p class="text-sm text-textGray">
              {{ content.alreadyHaveAccount }}
              <NuxtLink :to="{ path: '/auth', query: authRedirectQuery }" class="w-full p-1 text-center cursor-pointer text-oceanBlue">
                {{ content.signIn }}</NuxtLink>
            </p>
          </div>

          <!-- Previous Button -->
          <div class="flex items-center justify-center px-2 ">
            <button type="button" @click="switchTab('tabOne')"
              class="flex items-center w-auto h-8 gap-2 px-4 transition-all duration-500 border rounded-full cursor-pointer hover:bg-oceanBlue hover:text-white text-oceanBlue border-oceanBlue animate-bounce-horizontal group">
              <Icon name="f7:arrow-left" class="group-hover:text-white" size="16" />
              <p class="text-small group-hover:text-white">{{ content.back }}</p>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
