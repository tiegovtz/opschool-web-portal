<script setup lang="ts">
import { sanitize } from "~/utilities/sanitizeInput";
import { auth } from "~/utilities/validationInput";
import { generateRandomID } from "~/utilities/generateRandomNumber";
import apiDocs from "~/utilities/apiDocs";
import {
  educationLevelNameToLevelsApiQuery,
} from "~/utilities/educationLevelApiMaps";
import {
  inferStudentAgeGroupFromDob,
  normalizeLookupGender,
  normalizeStudentLookupRecord,
  resolveLevelValueFromLookup,
  resolveLookupClassLevelValue,
} from "~/utilities/studentLookup";
import { CustomDropDownList } from "#components";
import type { Level } from "~/types/level.interface";
import type { educationLevel } from "~/types/educationlevel.interface";
import type {
  StudentInfoLookupRequest,
  StudentInfoLookupResponse,
  StudentLookupRecord,
  StudentPremLookupResponse,
} from "~/types/auth.interface";
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
  logoAlt: isSwahili.value
    ? "Nembo ya Taasisi ya Elimu Tanzania. Bango la juu lenye ukingo wa bluu lina maandishi 'Taasisi ya Elimu Tanzania.' Katikati kuna mwenge mweusi wenye mwali mwekundu na wa manjano. Chini ya mwenge kuna kitabu kilichofunguliwa chenye mistari ya bluu na dira mbili nyeusi chini yake. Upande wa kushoto wa nembo kuna jembe la rangi ya machungwa, na upande wa kulia kuna shoka la rangi ya machungwa, yote yakiwa yameelekezwa kuelekea ndani. Nembo imezungukwa na mabango ya utepe yaliyopinda yenye ukingo wa bluu. Bango la chini, pia lenye ukingo wa bluu, lina maandishi 'Elimu ni Kazi.'"
    : "An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text 'Taasisi ya Elimu Tanzania.' At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text 'Elimu ni Kazi.'",
  userTypeLabel: isSwahili.value ? "Chagua aina ya mtumiaji:" : "Select User Type:",
  userTypePlaceholder: isSwahili.value ? "(mfano: Mwanafunzi, Mwalimu ...)" : "(eg: Student, Teacher ...)",
  firstNamePlaceholder: isSwahili.value ? "Jina la kwanza" : "First Name",
  lastNamePlaceholder: isSwahili.value ? "Jina la mwisho" : "Last Name",
  educationLevelLabel: isSwahili.value ? "Chagua ngazi ya elimu:" : "Select Education Level:",
  educationLevelPlaceholder: isSwahili.value ? "(mfano: Msingi, Sekondari ...)" : "(eg: Secondary, Primary ...)",
  searchPlaceholder: isSwahili.value ? "Tafuta" : "Search",
  schoolLabel: isSwahili.value ? "Shule:" : "School:",
  studentRegistrationMethodLabel: isSwahili.value ? "Njia ya usajili wa mwanafunzi:" : "Student registration method:",
  studentRegistrationMethods: {
    manual: isSwahili.value ? "Weka taarifa mwenyewe" : "Enter details manually",
    premNumber: isSwahili.value ? "Tumia taarifa za mwanafunzi" : "Use student records",
  },
  studentRegistrationHints: {
    manual: isSwahili.value
      ? "Jaza taarifa zote za mwanafunzi mwenyewe."
      : "Fill in all student details manually.",
    premNumber: isSwahili.value
      ? "Tafuta taarifa za mwanafunzi kwa Prem Number au kwa namba ya usajili wa shule na darasa, kisha malizia taarifa zilizobaki."
      : "Find the student record by Prem Number or by school registration number and class, then complete the remaining fields.",
  },
  studentLookupModeLabel: isSwahili.value
    ? "Njia ya kutafuta taarifa za mwanafunzi:"
    : "Student lookup method:",
  studentLookupModes: {
    premNumber: isSwahili.value ? "Ninajua Prem Number" : "I know the Prem Number",
    classList: isSwahili.value ? "Sijui Prem Number" : "I don't know the Prem Number",
  },
  studentLookupModeHints: {
    premNumber: isSwahili.value
      ? "Weka Prem Number ya mwanafunzi ili kupata taarifa zake moja kwa moja."
      : "Enter the student's Prem Number to fetch the record directly.",
    classList: isSwahili.value
      ? "Weka namba ya usajili wa shule na darasa ili kupata wanafunzi wote wa darasa husika, kisha chagua mwanafunzi anayesajiliwa."
      : "Enter the school registration number and class to fetch all students in that class, then select the student being registered.",
  },
  premNumberLabel: isSwahili.value ? "Prem Number:" : "Prem Number:",
  premNumberPlaceholder: isSwahili.value ? "Mfano: 20190928782" : "Eg: 20190928782",
  fetchPremNumber: isSwahili.value ? "Pata taarifa" : "Fetch details",
  fetchingPremNumber: isSwahili.value ? "Inatafuta..." : "Fetching...",
  premLookupSuccess: isSwahili.value ? "Taarifa za mwanafunzi zimepatikana." : "Student details fetched successfully.",
  premLookupDetailsTitle: isSwahili.value ? "Taarifa za mwanafunzi" : "Student details",
  fetchStudentsByClass: isSwahili.value ? "Pata wanafunzi" : "Fetch students",
  fetchingStudentsByClass: isSwahili.value ? "Inatafuta wanafunzi..." : "Fetching students...",
  classLookupSuccess: isSwahili.value
    ? "Wanafunzi wamepatikana. Tafuta jina la mwanafunzi ili kuchagua anayesajiliwa."
    : "Students found. Search the student's name to select the student being registered.",
  classLookupSingleSuccess: isSwahili.value
    ? "Mwanafunzi mmoja amepatikana. Tafuta jina lake ili kumchagua."
    : "One student was found. Search the student's name to select the record.",
  classLookupEmpty: isSwahili.value
    ? "Hakuna mwanafunzi aliyepatikana kwa shule na darasa ulilochagua."
    : "No students were found for the selected school and class.",
  studentNameSearchLabel: isSwahili.value ? "Tafuta jina la mwanafunzi:" : "Search student name:",
  studentNameSearchPlaceholder: isSwahili.value
    ? "Andika angalau herufi 2 za jina"
    : "Type at least 2 letters of the name",
  studentNameSearchHelp: isSwahili.value
    ? "Orodha itaonekana baada ya kuandika jina ili kulinda faragha ya wanafunzi."
    : "Results appear only after typing a name to protect student privacy.",
  studentNameNoMatches: isSwahili.value
    ? "Hakuna jina linalofanana na ulichotafuta."
    : "No student names match your search.",
  studentSelectorLabel: isSwahili.value ? "Matokeo yanayofanana:" : "Matching results:",
  dobLabel: isSwahili.value ? "Tarehe ya kuzaliwa" : "Date of birth",
  schoolRegNoLabel: isSwahili.value ? "Namba ya usajili wa shule" : "School registration number",
  schoolRegNoPlaceholder: isSwahili.value ? "Mfano: S0101 au PS0101076" : "Eg: S0101 or PS0101076",
  classLevelLabel: isSwahili.value ? "Ngazi ya darasa:" : "Class Level:",
  classLevelPlaceholder: isSwahili.value ? "(mfano: Darasa la Kwanza ...)" : "(eg: Class One ...)",
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
  organizationPlaceholder: isSwahili.value ? "Taasisi/Shirika (mfano: Taasisi ya Elimu)" : "Organization (eg: Tanzania Institute of Education)",
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
    premSchoolMappingFailed: isSwahili.value
      ? "Imeshindikana kuoanisha shule ya mwanafunzi na shule iliyopo kwenye mfumo."
      : "Failed to map the student school to an existing school in the system.",
    premLevelMappingFailed: isSwahili.value
      ? "Imeshindikana kuoanisha darasa la mwanafunzi na ngazi iliyopo kwenye mfumo."
      : "Failed to map the student class level to an existing level in the system.",
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
    schoolRegNo: isSwahili.value
      ? "Namba ya usajili wa shule inahitajika"
      : "School registration number is required",
    district: isSwahili.value ? "Wilaya inahitajika" : "District is required",
    premNumber: isSwahili.value ? "Prem Number inahitajika" : "Prem Number is required",
    premLookup: isSwahili.value
      ? "Pata kwanza taarifa za mwanafunzi kwa Prem Number."
      : "Fetch the student details with the Prem Number first.",
    premLookupEducationLevel: isSwahili.value
      ? "Chagua kwanza ngazi ya elimu ya mwanafunzi."
      : "Select the student's education level first.",
    studentLookup: isSwahili.value
      ? "Pata na uchague kwanza mwanafunzi anayesajiliwa."
      : "Fetch and select the student to register first.",
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
type StudentRegistrationMethod = "manual" | "premNumber";
type StudentLookupMode = "premNumber" | "classList";
type LookupStatus = "idle" | "pending" | "success" | "error";

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
      schoolRegNo: string | null;
      district: string | null;
      premNumber: string | null;
      studentLookup: string | null;
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
      schoolRegNo: null,
      district: null,
      premNumber: null,
      studentLookup: null,
      organization: null,
      userOrgRole: null,
      otherRole: null,
      userExist: null,
    },
  },
});

const studentRegistrationMethod = ref<StudentRegistrationMethod>("manual");
const studentLookupMode = ref<StudentLookupMode>("premNumber");
const studentLookupSchoolRegNo = ref("");
const studentPremLookup = reactive<{
  premNumber: string;
  status: LookupStatus;
  feedback: string | null;
  data: StudentLookupRecord | null;
}>({
  premNumber: "",
  status: "idle",
  feedback: null,
  data: null,
});
const studentClassLookup = reactive<{
  status: LookupStatus;
  feedback: string | null;
  records: StudentLookupRecord[];
  searchTerm: string;
  selectedPremNumber: string;
}>({
  status: "idle",
  feedback: null,
  records: [],
  searchTerm: "",
  selectedPremNumber: "",
});

const selectedEducationLevelRecord = computed(() =>
  listEducationLevels.value.find((level) => level._id === usersignUp.educationLevel),
);

const selectedStudentEducationBucket = computed(() => {
  const normalizedEducationLevel = (selectedEducationLevelRecord.value?.name || "")
    .trim()
    .toLowerCase();

  if (!normalizedEducationLevel) return "";
  if (normalizedEducationLevel.includes("primary") || normalizedEducationLevel.includes("msingi")) {
    return "primary";
  }
  if (normalizedEducationLevel.includes("secondary") || normalizedEducationLevel.includes("sekondari")) {
    return "secondary";
  }

  return "";
});

const isStudentManualRegistration = computed(
  () => isStudent.value && studentRegistrationMethod.value === "manual",
);
const isStudentLookupRegistration = computed(
  () => isStudent.value && studentRegistrationMethod.value === "premNumber",
);
const isStudentPremNumberLookup = computed(
  () => isStudentLookupRegistration.value && studentLookupMode.value === "premNumber",
);
const isStudentClassLookup = computed(
  () => isStudentLookupRegistration.value && studentLookupMode.value === "classList",
);

const selectedStudentFromClassLookup = computed(
  () =>
    studentClassLookup.records.find(
      (student) => student.premNumber === studentClassLookup.selectedPremNumber,
    ) || null,
);

const selectedStudentLookupRecord = computed(() =>
  isStudentPremNumberLookup.value
    ? studentPremLookup.data
    : isStudentClassLookup.value
      ? selectedStudentFromClassLookup.value
      : null,
);

const studentLookupDisplay = computed(() => {
  if (!selectedStudentLookupRecord.value) return [];

  return [
    { label: content.value.firstNamePlaceholder, value: selectedStudentLookupRecord.value.firstName },
    { label: content.value.lastNamePlaceholder, value: selectedStudentLookupRecord.value.lastName },
    { label: content.value.dobLabel, value: selectedStudentLookupRecord.value.dob },
    { label: content.value.sexLabel, value: selectedStudentLookupRecord.value.sex },
    { label: content.value.classLevelLabel, value: selectedStudentLookupRecord.value.classLevel },
    { label: content.value.schoolLabel ?? "School", value: selectedStudentLookupRecord.value.schoolName },
    { label: content.value.schoolRegNoLabel, value: selectedStudentLookupRecord.value.schoolRegNo },
  ];
});

const normalizedStudentClassSearchTerm = computed(() =>
  studentClassLookup.searchTerm.trim().toLowerCase(),
);

const hasStudentClassSearchTerm = computed(() =>
  normalizedStudentClassSearchTerm.value.length >= 2,
);

const filteredStudentClassLookupRecords = computed(() => {
  if (!hasStudentClassSearchTerm.value) return [];

  return studentClassLookup.records.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.trim().toLowerCase();
    return fullName.includes(normalizedStudentClassSearchTerm.value);
  });
});

const studentClassLookupOptions = computed(() =>
  filteredStudentClassLookupRecords.value.map((student) => ({
    id: student.premNumber,
    name: `${student.firstName} ${student.lastName}`.trim(),
  })),
);

const selectStudentFromFilteredResult = (student: StudentLookupRecord) => {
  handleClassLookupSelection(student.premNumber);
  studentClassLookup.searchTerm = `${student.firstName} ${student.lastName}`.trim();
};

const clearStudentPrefilledDetails = (options?: { preserveSchool?: boolean; preserveClassLevel?: boolean }) => {
  usersignUp.fname = null;
  usersignUp.lname = null;
  usersignUp.gender = null;
  if (!options?.preserveSchool) {
    usersignUp.school = "";
    usersignUp.controller.errors.school = null;
  }
  if (!options?.preserveClassLevel) {
    classLevel.value = "";
    usersignUp.controller.errors.classLevel = null;
  }
  usersignUp.userName = null;
  usersignUp.controller.errors.fname = null;
  usersignUp.controller.errors.lname = null;
  usersignUp.controller.errors.gender = null;
};

const resetStudentPremLookup = (options?: { preservePremNumber?: boolean }) => {
  studentPremLookup.status = "idle";
  studentPremLookup.feedback = null;
  studentPremLookup.data = null;
  if (!options?.preservePremNumber) {
    studentPremLookup.premNumber = "";
  }
  usersignUp.controller.errors.premNumber = null;
  usersignUp.controller.errors.studentLookup = null;
  clearStudentPrefilledDetails();
};

const resetStudentClassLookup = () => {
  studentClassLookup.status = "idle";
  studentClassLookup.feedback = null;
  studentClassLookup.records = [];
  studentClassLookup.searchTerm = "";
  studentClassLookup.selectedPremNumber = "";
  usersignUp.controller.errors.schoolRegNo = null;
  usersignUp.controller.errors.studentLookup = null;
  clearStudentPrefilledDetails({ preserveClassLevel: true });
};

const applyStudentLookupData = (
  studentData: StudentLookupRecord,
  options?: { preserveSchool?: boolean; preserveClassLevel?: boolean },
) => {
  usersignUp.fname = studentData.firstName || null;
  usersignUp.lname = studentData.lastName || null;
  usersignUp.gender = normalizeLookupGender(studentData.sex) || null;
  if (!options?.preserveSchool) {
    usersignUp.school = studentData.schoolName || "";
  }
  if (!options?.preserveClassLevel) {
    classLevel.value = resolveLevelValueFromLookup(studentData.classLevel, listLevel.value);
  }
  usersignUp.age = inferStudentAgeGroupFromDob(studentData.dob) || usersignUp.age;
  usersignUp.controller.errors.fname = null;
  usersignUp.controller.errors.lname = null;
  usersignUp.controller.errors.gender = null;
  if (!options?.preserveSchool) {
    usersignUp.controller.errors.school = null;
  }
  if (!options?.preserveClassLevel) {
    usersignUp.controller.errors.classLevel = null;
  }
  usersignUp.controller.errors.premNumber = null;
  usersignUp.controller.errors.studentLookup = null;
};

const getStudentPremLookupEndpoint = () => {
  if (selectedStudentEducationBucket.value === "primary") {
    return apiDocs.auth.primaryStudentInfo(studentPremLookup.premNumber.trim());
  }
  if (selectedStudentEducationBucket.value === "secondary") {
    return apiDocs.auth.secondaryStudentInfo(studentPremLookup.premNumber.trim());
  }
  return null;
};

const resolveStudentLevelValue = () => {
  const resolvedLevelValue = resolveLevelValueFromLookup(classLevel.value, listLevel.value);
  return resolvedLevelValue || null;
};

const resolveStudentLookupRequest = async (): Promise<StudentInfoLookupRequest | null> => {
  const schoolRegNo = studentLookupSchoolRegNo.value.trim();
  const normalizedClassLevel = resolveLookupClassLevelValue(classLevel.value, listLevel.value);

  if (!schoolRegNo || !normalizedClassLevel) {
    return null;
  }

  return {
    schoolRegNo,
    classLevel: normalizedClassLevel,
    isPrimary: selectedStudentEducationBucket.value === "primary",
  };
};

const resolveStudentSchoolValue = async () => {
  if (selectedStudentLookupRecord.value?.schoolName) {
    return selectedStudentLookupRecord.value.schoolName.trim();
  }

  return usersignUp.school?.trim() || null;
};

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
    if (isStudentPremNumberLookup.value) {
      resetStudentPremLookup({ preservePremNumber: true });
    }
    if (isStudentClassLookup.value) {
      resetStudentClassLookup();
    }
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

const fetchStudentInfoByPremNumber = async () => {
  const premNumber = studentPremLookup.premNumber.trim();

  if (!usersignUp.educationLevel?.trim()) {
    usersignUp.controller.errors.educationLevel = content.value.errors.premLookupEducationLevel;
    usersignUp.controller.errors.premNumber = null;
    return;
  }

  if (!premNumber) {
    usersignUp.controller.errors.premNumber = content.value.errors.premNumber;
    studentPremLookup.feedback = null;
    return;
  }

  const endpoint = getStudentPremLookupEndpoint();
  if (!endpoint) {
    usersignUp.controller.errors.premNumber = content.value.errors.premLookupEducationLevel;
    return;
  }

  usersignUp.controller.errors.premNumber = null;
  usersignUp.controller.errors.studentLookup = null;
  studentPremLookup.status = "pending";
  studentPremLookup.feedback = null;
  studentPremLookup.data = null;
  resetStudentClassLookup();
  clearStudentPrefilledDetails();

  try {
    const response = await $fetch<StudentPremLookupResponse>(endpoint, {
      method: "POST",
    });

    studentPremLookup.data = normalizeStudentLookupRecord(response);
    studentPremLookup.status = "success";
    studentPremLookup.feedback = content.value.premLookupSuccess;
    applyStudentLookupData(studentPremLookup.data);
  } catch (error: unknown) {
    const fetchError = error as FetchError;
    const status = fetchError?.response?.status ?? fetchError?.status;

    studentPremLookup.status = "error";
    studentPremLookup.data = null;
    clearStudentPrefilledDetails();

    if (status === 404) {
      studentPremLookup.feedback = content.value.feedback.notFound;
    } else if (status === 400) {
      studentPremLookup.feedback = content.value.feedback.badRequest;
    } else if (status === 503) {
      studentPremLookup.feedback = content.value.feedback.serviceUnavailable;
    } else {
      studentPremLookup.feedback = content.value.feedback.unexpected;
    }
  }
};

const handleClassLookupSelection = (premNumber: string) => {
  studentClassLookup.selectedPremNumber = premNumber;
  const selectedStudent = studentClassLookup.records.find((student) => student.premNumber === premNumber);

  if (!selectedStudent) {
    clearStudentPrefilledDetails({ preserveClassLevel: true });
    return;
  }

  applyStudentLookupData(selectedStudent, { preserveClassLevel: true });
};

const fetchStudentsByClass = async () => {
  if (!usersignUp.educationLevel?.trim()) {
    usersignUp.controller.errors.educationLevel = content.value.errors.premLookupEducationLevel;
    return;
  }

  if (!studentLookupSchoolRegNo.value.trim()) {
    usersignUp.controller.errors.schoolRegNo = content.value.errors.schoolRegNo;
    return;
  }

  if (!classLevel.value?.trim()) {
    usersignUp.controller.errors.classLevel = content.value.errors.classLevel;
    return;
  }

  const requestBody = await resolveStudentLookupRequest();
  if (!requestBody) {
    usersignUp.controller.errors.studentLookup = content.value.errors.studentLookup;
    return;
  }

  usersignUp.controller.errors.schoolRegNo = null;
  usersignUp.controller.errors.classLevel = null;
  usersignUp.controller.errors.studentLookup = null;
  studentClassLookup.status = "pending";
  studentClassLookup.feedback = null;
  studentClassLookup.records = [];
  studentClassLookup.searchTerm = "";
  studentClassLookup.selectedPremNumber = "";
  studentPremLookup.data = null;
  studentPremLookup.status = "idle";
  studentPremLookup.feedback = null;
  clearStudentPrefilledDetails({ preserveClassLevel: true });

  try {
    const response = await $fetch<StudentInfoLookupResponse>(apiDocs.auth.studentInfo, {
      method: "POST",
      body: requestBody,
    });

    const responseItems = Array.isArray(response) ? response : response ? [response] : [];
    const records = responseItems.map(normalizeStudentLookupRecord).filter((student) => student.premNumber);
    studentClassLookup.records = records;
    studentClassLookup.status = "success";

    if (!records.length) {
      studentClassLookup.feedback = content.value.classLookupEmpty;
      return;
    }

    studentClassLookup.feedback = records.length === 1
      ? content.value.classLookupSingleSuccess
      : content.value.classLookupSuccess;
  } catch (error: unknown) {
    const fetchError = error as FetchError;
    const status = fetchError?.response?.status ?? fetchError?.status;

    studentClassLookup.status = "error";
    studentClassLookup.records = [];
    studentClassLookup.searchTerm = "";
    studentClassLookup.selectedPremNumber = "";
    clearStudentPrefilledDetails({ preserveClassLevel: true });

    if (status === 404) {
      studentClassLookup.feedback = content.value.classLookupEmpty;
    } else if (status === 400) {
      studentClassLookup.feedback = content.value.feedback.badRequest;
    } else if (status === 503) {
      studentClassLookup.feedback = content.value.feedback.serviceUnavailable;
    } else {
      studentClassLookup.feedback = content.value.feedback.unexpected;
    }
  }
};

const signUp = async () => {
  if (requiresClassLevel.value && !classLevel.value?.trim() && selectedStudentLookupRecord.value) {
    classLevel.value = resolveLevelValueFromLookup(selectedStudentLookupRecord.value.classLevel, listLevel.value);
  }

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
  const hasStudentLevel = !requiresClassLevel.value || Boolean(
    classLevel.value?.trim() || selectedStudentLookupRecord.value?.classLevel,
  );
  const hasStudentLookupFields = !isStudentLookupRegistration.value || Boolean(
    isStudentPremNumberLookup.value
      ? studentPremLookup.premNumber.trim() && studentPremLookup.data
      : selectedStudentLookupRecord.value,
  );

  if (
    hasBaseFields &&
    hasEducationFields &&
    hasSchoolFields &&
    hasContactFields &&
    hasStakeholderFields &&
    hasStudentLevel &&
    hasStudentLookupFields
  ) {

    // 
    usersignUp.controller.isSent = 'pending';
    usersignUp.controller.isSubmitted = true;
    // user role other,

    try {
      const studentLevelValue = resolveStudentLevelValue();
      const studentSchoolValue = typeKey === 'Student'
        ? await resolveStudentSchoolValue()
        : (usersignUp.school?.trim() || null);

      if (typeKey === 'Student' && isStudentPremNumberLookup.value && !studentSchoolValue) {
        usersignUp.controller.isSent = 'error';
        usersignUp.controller.feedback = content.value.feedback.premSchoolMappingFailed;
        return;
      }

      if (typeKey === 'Student' && !studentLevelValue) {
        usersignUp.controller.isSent = 'error';
        usersignUp.controller.feedback = content.value.feedback.premLevelMappingFailed;
        return;
      }

      const response = await $fetch.raw('/api/auth/sign-up', {
        method: "POST",
        body: typeKey == 'Student' ?
          {
            name: sanitize.input(usersignUp.fname + " " + usersignUp.lname),
            password: usersignUp.password,
            type: backendType,
            gender: usersignUp.gender,
            region: usersignUp.region,
            school: studentSchoolValue,
            district: usersignUp.district,
            ageGroup: usersignUp.age,
            level: studentLevelValue,
            terms: true,
            roles: ['Student'],
            username: usersignUp.userName && usersignUp.userName.trim() !== '' ? usersignUp.userName : null,
            premNumber: isStudentLookupRegistration.value
              ? (selectedStudentLookupRecord.value?.premNumber || null)
              : null,
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
      const backendMessage =
        fetchError?.response?._data?.message ??
        fetchError?.response?._data?.error ??
        fetchError?.data?.message ??
        fetchError?.data?.error;
      if (status) {
        // The request was made, but the server responded with a status code
        switch (status) {
          case 400:
            usersignUp.controller.feedback = backendMessage || content.value.feedback.badRequest;
            break;
          case 401:
            usersignUp.controller.feedback = backendMessage || content.value.feedback.unauthorized;
            break;
          case 403:
            usersignUp.controller.feedback = backendMessage || content.value.feedback.forbidden;
            break;
          case 404:
            usersignUp.controller.feedback = backendMessage || content.value.feedback.notFound;
            break;
          case 422:
            if (errorMessage.includes('email')) {
              usersignUp.controller.feedback = content.value.feedback.emailExists;
            } else if (errorMessage.includes('phone')) {
              usersignUp.controller.feedback = content.value.feedback.phoneExists;
            } else if (errorMessage.includes('username')) {
              usersignUp.controller.feedback = content.value.feedback.usernameTaken;
            } else {
              usersignUp.controller.feedback = backendMessage || content.value.feedback.unexpected;
            }
            break;
          case 500:
            usersignUp.controller.feedback = backendMessage || content.value.feedback.internalServer;
            break;
          case 503:
            usersignUp.controller.feedback = backendMessage || content.value.feedback.serviceUnavailable;
            break;
          default:
            usersignUp.controller.feedback = backendMessage || content.value.feedback.unexpected;
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
    if (!usersignUp.fname && (!isStudentLookupRegistration.value || Boolean(selectedStudentLookupRecord.value))) {
      usersignUp.controller.errors.fname = content.value.errors.firstName;
      switchTab("tabOne");
    }
    if (!usersignUp.gender && (!isStudentLookupRegistration.value || Boolean(selectedStudentLookupRecord.value))) {
      usersignUp.controller.errors.gender = content.value.errors.gender;
      switchTab("tabOne");
    }
    if (!usersignUp.lname && (!isStudentLookupRegistration.value || Boolean(selectedStudentLookupRecord.value))) {
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
    if (isStudentPremNumberLookup.value && !studentPremLookup.premNumber.trim()) {
      usersignUp.controller.errors.premNumber = content.value.errors.premNumber;
      switchTab("tabOne");
    } else if (isStudentPremNumberLookup.value && !studentPremLookup.data) {
      usersignUp.controller.errors.premNumber = content.value.errors.premLookup;
      switchTab("tabOne");
    } else {
      usersignUp.controller.errors.premNumber = null;
    }
    if (isStudentClassLookup.value && !selectedStudentLookupRecord.value) {
      usersignUp.controller.errors.studentLookup = content.value.errors.studentLookup;
      switchTab("tabOne");
    } else {
      usersignUp.controller.errors.studentLookup = null;
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

    if (
      requiresSchoolSelection.value &&
      !isStudentClassLookup.value &&
      !usersignUp.school?.trim() &&
      (!isStudentLookupRegistration.value || Boolean(selectedStudentLookupRecord.value))
    ) {
      usersignUp.controller.errors.school = content.value.errors.school;
      switchTab("tabOne");
    } else {
      usersignUp.controller.errors.school = null;
    }

    if (
      requiresClassLevel.value &&
      !classLevel.value?.trim() &&
      !selectedStudentLookupRecord.value?.classLevel &&
      (!isStudentLookupRegistration.value || isStudentClassLookup.value || Boolean(selectedStudentLookupRecord.value))
    ) {
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
      studentLookupSchoolRegNo.value = "";
      classLevel.value = "";
      listLevel.value = [];
      resetStudentPremLookup();
      resetStudentClassLookup();
      usersignUp.controller.errors.educationLevel = null;
      usersignUp.controller.errors.school = null;
      usersignUp.controller.errors.schoolRegNo = null;
      usersignUp.controller.errors.classLevel = null;
    }

    if (normalizeUserTypeKey(type) !== "Student") {
      studentRegistrationMethod.value = "manual";
      resetStudentPremLookup();
      resetStudentClassLookup();
      studentLookupMode.value = "premNumber";
      studentLookupSchoolRegNo.value = "";
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

watch(studentRegistrationMethod, (method) => {
  usersignUp.controller.errors.premNumber = null;
  usersignUp.controller.errors.schoolRegNo = null;
  usersignUp.controller.errors.studentLookup = null;

  if (method === "manual") {
    resetStudentPremLookup();
    resetStudentClassLookup();
    studentLookupMode.value = "premNumber";
    studentLookupSchoolRegNo.value = "";
    return;
  }

  resetStudentPremLookup({ preservePremNumber: true });
  resetStudentClassLookup();
  usersignUp.email = null;
  usersignUp.phone = null;
  usersignUp.controller.errors.email = null;
  usersignUp.controller.errors.phone = null;
});

watch(studentLookupMode, (mode) => {
  usersignUp.controller.errors.premNumber = null;
  usersignUp.controller.errors.schoolRegNo = null;
  usersignUp.controller.errors.studentLookup = null;

  if (mode === "premNumber") {
    resetStudentClassLookup();
    studentLookupSchoolRegNo.value = "";
    return;
  }

  resetStudentPremLookup();
});

watch(
  () => studentPremLookup.premNumber,
  (premNumber, previousPremNumber) => {
    if (premNumber?.trim()) {
      usersignUp.controller.errors.premNumber = null;
    }

    if (premNumber !== previousPremNumber && !studentPremLookup.data) {
      studentPremLookup.feedback = null;
      if (studentPremLookup.status !== "pending") {
        studentPremLookup.status = "idle";
      }
    }

    if (premNumber !== previousPremNumber && studentPremLookup.data) {
      resetStudentPremLookup({ preservePremNumber: true });
    }
  },
);

watch(
  () => studentClassLookup.selectedPremNumber,
  (premNumber) => {
    if (premNumber?.trim()) {
      usersignUp.controller.errors.studentLookup = null;
    }
  },
);

watch(
  () => studentClassLookup.searchTerm,
  () => {
    if (!studentClassLookup.selectedPremNumber) return;

    if (!hasStudentClassSearchTerm.value) {
      studentClassLookup.selectedPremNumber = "";
      clearStudentPrefilledDetails({ preserveClassLevel: true });
      return;
    }

    const selectedStudent = selectedStudentFromClassLookup.value;
    const selectedName = `${selectedStudent?.firstName ?? ""} ${selectedStudent?.lastName ?? ""}`
      .trim()
      .toLowerCase();

    if (!selectedName.includes(normalizedStudentClassSearchTerm.value)) {
      studentClassLookup.selectedPremNumber = "";
      clearStudentPrefilledDetails({ preserveClassLevel: true });
    }
  },
);

watch(studentLookupSchoolRegNo, (value) => {
  if (value?.trim()) {
    usersignUp.controller.errors.schoolRegNo = null;
  } else if (isStudentClassLookup.value) {
    usersignUp.controller.errors.schoolRegNo = content.value.errors.schoolRegNo;
  } else {
    usersignUp.controller.errors.schoolRegNo = null;
  }
});

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
  [studentLookupSchoolRegNo, classLevel],
  ([schoolRegNo, level], previousValues) => {
    if (!isStudentClassLookup.value || !previousValues) {
      return;
    }

    const [previousSchoolRegNo, previousLevel] = previousValues;
    const hasCriteriaChanged =
      schoolRegNo !== previousSchoolRegNo ||
      level !== previousLevel;

    if (hasCriteriaChanged && (studentClassLookup.records.length || selectedStudentLookupRecord.value)) {
      resetStudentClassLookup();
    }
  },
);

watch(
  listLevel,
  () => {
    if (studentPremLookup.data && isStudentPremNumberLookup.value) {
      classLevel.value = resolveLevelValueFromLookup(studentPremLookup.data.classLevel, listLevel.value);
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
    if (!requiresSchoolSelection.value || isStudentClassLookup.value) {
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

    if (isStudentPremNumberLookup.value && !studentPremLookup.premNumber.trim()) {
      usersignUp.controller.errors.premNumber = content.value.errors.premNumber;
      return;
    }

    if (isStudentPremNumberLookup.value && !studentPremLookup.data) {
      usersignUp.controller.errors.premNumber = content.value.errors.premLookup;
      return;
    }

    if (isStudentClassLookup.value && !selectedStudentLookupRecord.value) {
      usersignUp.controller.errors.studentLookup = content.value.errors.studentLookup;
      return;
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

    if (isStudentClassLookup.value && !studentLookupSchoolRegNo.value.trim()) {
      usersignUp.controller.errors.schoolRegNo = content.value.errors.schoolRegNo;
      return;
    }

    if (!isStudentClassLookup.value && requiresSchoolSelection.value && (!usersignUp.school || usersignUp.school.trim() == " ")) {
      usersignUp.controller.errors.school = content.value.errors.school;
      return;
    }

    if (requiresClassLevel.value && !classLevel.value.trim() && isStudentPremNumberLookup.value && studentPremLookup.data) {
      classLevel.value = resolveLevelValueFromLookup(studentPremLookup.data.classLevel, listLevel.value);
    }

    const hasClassLevelForStep = Boolean(
      classLevel.value.trim() || selectedStudentLookupRecord.value?.classLevel,
    );

    if (requiresClassLevel.value && !hasClassLevelForStep) {
      usersignUp.controller.errors.classLevel = content.value.errors.classLevel;
      return;
    }
    usersignUp.controller.errors.classLevel = null;

    if (
      usersignUp.type &&
      usersignUp.fname &&
      usersignUp.lname &&
      usersignUp.gender &&
      usersignUp.region &&
      usersignUp.district &&
      (!requiresEducationLevel.value || usersignUp.educationLevel) &&
      (!requiresSchoolSelection.value || isStudentClassLookup.value || usersignUp.school) &&
      (!requiresClassLevel.value || hasClassLevelForStep)
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
          :alt="content.logoAlt" />
      </NuxtLink>

      <form @submit.prevent="signUp" @keydown.enter.prevent :class="['text-textGray md:h-[530px] h-dvh relative overflow-y-scroll text-extraSmall lg:scroll-height lg:overflow-y-scroll no-scrollbar',
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
          'absolute inset-0 flex flex-col px-6 transition-transform duration-500',
          inputTabs === 'tabOne' ? 'translate-x-0' : '-translate-x-full pointer-events-none'
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

          <div v-if="isStudent" class="px-2 mb-4 border-b border-gray-300">
            <div class="flex flex-col items-start gap-3 py-2">
              <label class="font-semibold capitalize text-oceanBlue text-extraSmall">
                {{ content.studentRegistrationMethodLabel }}
              </label>

              <div class="flex flex-wrap gap-4">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input v-model="studentRegistrationMethod" type="radio" value="manual" class="w-4 h-4 checked:bg-oceanBlue" />
                  <span>{{ content.studentRegistrationMethods.manual }}</span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input v-model="studentRegistrationMethod" type="radio" value="premNumber" class="w-4 h-4 checked:bg-oceanBlue" />
                  <span>{{ content.studentRegistrationMethods.premNumber }}</span>
                </label>
              </div>

              <p class="text-textGray/70 text-smallest">
                {{
                  isStudentLookupRegistration
                    ? content.studentRegistrationHints.premNumber
                    : content.studentRegistrationHints.manual
                }}
              </p>
            </div>
          </div>

          <div v-if="isStudentLookupRegistration" class="px-2 mb-4 border-b border-gray-300">
            <div class="flex flex-col items-start gap-3 py-2">
              <label class="font-semibold capitalize text-oceanBlue text-extraSmall">
                {{ content.studentLookupModeLabel }}
              </label>

              <div class="flex flex-wrap gap-4">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input v-model="studentLookupMode" type="radio" value="premNumber" class="w-4 h-4 checked:bg-oceanBlue" />
                  <span>{{ content.studentLookupModes.premNumber }}</span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input v-model="studentLookupMode" type="radio" value="classList" class="w-4 h-4 checked:bg-oceanBlue" />
                  <span>{{ content.studentLookupModes.classList }}</span>
                </label>
              </div>

              <p class="text-textGray/70 text-smallest">
                {{
                  isStudentPremNumberLookup
                    ? content.studentLookupModeHints.premNumber
                    : content.studentLookupModeHints.classList
                }}
              </p>
            </div>
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
                :placeholder="content.educationLevelPlaceholder" @update-model-value="usersignUp.educationLevel = $event" :search-placeholder="content.searchPlaceholder" />
            </div>

            <small v-if="usersignUp.controller.errors.educationLevel" aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.educationLevel}`" class="w-full text-red-500 text-smallest">
              {{ usersignUp.controller.errors.educationLevel }}
            </small>
          </div>

          <div v-if="isStudentPremNumberLookup" :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.premNumber || studentPremLookup.status === 'error',
            }
          ]">
            <label for="premNumber" class="font-semibold capitalize text-oceanBlue text-extraSmall">
              {{ content.premNumberLabel }}
            </label>

            <div class="flex items-center w-full gap-2">
              <input
                id="premNumber"
                v-model="studentPremLookup.premNumber"
                type="text"
                name="premNumber"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                :placeholder="content.premNumberPlaceholder"
              />
              <button
                type="button"
                class="py-2 w-44 text-white transition-colors rounded-md bg-oceanBlue hover:bg-oceanBlue/80 disabled:cursor-not-allowed disabled:bg-oceanBlue/50"
                :disabled="studentPremLookup.status === 'pending'"
                @click="fetchStudentInfoByPremNumber"
              >
                {{ studentPremLookup.status === 'pending' ? content.fetchingPremNumber : content.fetchPremNumber }}
              </button>
            </div>

            <small
              v-if="usersignUp.controller.errors.premNumber"
              aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.premNumber}`"
              class="w-full text-red-500 text-smallest"
            >
              {{ usersignUp.controller.errors.premNumber }}
            </small>
            <small
              v-else-if="studentPremLookup.feedback"
              aria-live="polite"
              class="w-full text-smallest"
              :class="studentPremLookup.status === 'success' ? 'text-green-600' : 'text-red-500'"
            >
              {{ studentPremLookup.feedback }}
            </small>
          </div>

          <!-- First Name -->
          <div v-if="!isStudentLookupRegistration" :class="[
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
          <div v-if="!isStudentLookupRegistration" :class="[
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

          <!-- school -->
          <div v-if="isStudentOrTeacher && !isStudentLookupRegistration" :class="[
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

          <div v-if="isStudentClassLookup" :class="[
            'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
            {
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.schoolRegNo,
            }
          ]">
            <label for="schoolRegNo" class="font-semibold capitalize text-oceanBlue text-extraSmall">
              {{ content.schoolRegNoLabel }}
            </label>

            <div class="flex items-center w-full">
              <input
                id="schoolRegNo"
                v-model="studentLookupSchoolRegNo"
                type="text"
                name="schoolRegNo"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                :placeholder="content.schoolRegNoPlaceholder"
              />
            </div>

            <small
              v-if="usersignUp.controller.errors.schoolRegNo"
              aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.schoolRegNo}`"
              class="w-full text-red-500 text-smallest"
            >
              {{ usersignUp.controller.errors.schoolRegNo }}
            </small>
          </div>

          <div class="flex flex-col items-start w-full my-2" v-if="isStudentManualRegistration || isStudentClassLookup">
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

          <div
            v-if="isStudentClassLookup"
            :class="[
              'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
              {
                'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                  usersignUp.controller.errors.studentLookup || studentClassLookup.status === 'error',
              }
            ]"
          >
            <div class="flex items-center justify-between w-full gap-3">
              <label for="studentNameSearch" class="font-semibold capitalize text-oceanBlue text-extraSmall">
                {{ content.studentNameSearchLabel }}
              </label>
              <button
                type="button"
                class="py-2 px-4 text-white transition-colors rounded-md bg-oceanBlue hover:bg-oceanBlue/80 disabled:cursor-not-allowed disabled:bg-oceanBlue/50"
                :disabled="studentClassLookup.status === 'pending'"
                @click="fetchStudentsByClass"
              >
                {{ studentClassLookup.status === 'pending' ? content.fetchingStudentsByClass : content.fetchStudentsByClass }}
              </button>
            </div>

            <input
              id="studentNameSearch"
              v-model="studentClassLookup.searchTerm"
              type="text"
              name="studentNameSearch"
              autocomplete="off"
              class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
              :placeholder="content.studentNameSearchPlaceholder"
              :disabled="!studentClassLookup.records.length || studentClassLookup.status === 'pending'"
            />

            <small
              v-if="studentClassLookup.records.length && !hasStudentClassSearchTerm"
              aria-live="polite"
              class="w-full text-textGray/60 text-smallest"
            >
              {{ content.studentNameSearchHelp }}
            </small>
            <small
              v-else-if="hasStudentClassSearchTerm && studentClassLookup.records.length && !studentClassLookupOptions.length"
              aria-live="polite"
              class="w-full text-red-500 text-smallest"
            >
              {{ content.studentNameNoMatches }}
            </small>

            <label v-if="studentClassLookupOptions.length" class="font-semibold capitalize text-oceanBlue text-extraSmall">
              {{ content.studentSelectorLabel }}
            </label>
            <div
              v-if="studentClassLookupOptions.length"
              class="w-full overflow-hidden bg-white border border-slate-200 rounded-md shadow-sm"
            >
              <button
                v-for="student in filteredStudentClassLookupRecords"
                :key="student.premNumber"
                type="button"
                class="w-full px-4 py-3 text-left transition-colors border-b last:border-b-0 border-slate-100 hover:bg-oceanBlue/10 focus:outline-none focus:bg-oceanBlue/10"
                :class="studentClassLookup.selectedPremNumber === student.premNumber ? 'bg-oceanBlue/10 text-oceanBlue font-semibold' : 'text-textGray'"
                @click="selectStudentFromFilteredResult(student)"
              >
                {{ `${student.firstName} ${student.lastName}`.trim() }}
              </button>
            </div>

            <small
              v-if="usersignUp.controller.errors.studentLookup"
              aria-live="assertive"
              :aria-label="`${usersignUp.controller.errors.studentLookup}`"
              class="w-full text-red-500 text-smallest"
            >
              {{ usersignUp.controller.errors.studentLookup }}
            </small>
            <small
              v-else-if="studentClassLookup.feedback"
              aria-live="polite"
              class="w-full text-smallest"
              :class="studentClassLookup.status === 'success' ? 'text-green-600' : 'text-red-500'"
            >
              {{ studentClassLookup.feedback }}
            </small>
          </div>

          <div v-if="selectedStudentLookupRecord" class="p-3 mb-4 rounded-md bg-slate-50">
            <p class="mb-3 font-semibold text-oceanBlue text-extraSmall">{{ content.premLookupDetailsTitle }}</p>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div
                v-for="item in studentLookupDisplay"
                :key="item.label"
                class="p-2 bg-white border border-slate-200 rounded-md"
              >
                <p class="text-textGray/60 text-smallest">{{ item.label }}</p>
                <p class="font-medium text-textGray">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <!-- gender input radio -->
          <div v-if="!isStudentLookupRegistration" :class="[
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
          'absolute inset-0 flex flex-col px-6 transition-transform duration-500',
          inputTabs === 'tabTwo' ? 'translate-x-0' : 'translate-x-full pointer-events-none'
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
