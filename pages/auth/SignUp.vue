<script setup>
import apiDocs from "~/utilities/api-docs";
import messages from "~/utilities/messages";
import { sanitize } from "~/utilities/sanitizeInput";
import { auth } from "~/utilities/validationInput";
import axios from 'axios'

// input tabs control
const inputTabs = ref("tabOne");
const signUp = async () => {
  if (
    usersignUp.age &&
    usersignUp.confirm_password &&
    usersignUp.email &&
    usersignUp.fname &&
    usersignUp.gender &&
    usersignUp.lname &&
    usersignUp.password &&
    usersignUp.password === usersignUp.confirm_password &&
    usersignUp.phone &&
    usersignUp.region !== "" &&
    usersignUp.role !== ""
  ) {

    // 
    usersignUp.controller.isSubmitted = true;


    // submit data
    await axios.post(apiDocs.auth.signUp, {
        name: sanitize.input(usersignUp.fname + " " + usersignUp.lname),
        password: usersignUp.password,
        phoneNumber: sanitize.input(usersignUp.phone),
        type: usersignUp.role,
        email: sanitize.input(usersignUp.email),
        gender: usersignUp.gender,
        region: usersignUp.region,
        school: "",
        district: "",
        age: usersignUp.age,
        terms: true,
      })
      .then((response) => {
        if (!response.ok) {
          usersignUp.controller.isSent = false;
          return
        }
        usersignUp.controller.isSent = true;
       
      })
      .catch((error) => {
        usersignUp.controller.isSent = false;
      });
  } else {
    usersignUp.controller.isSubmitted = false;

    if (!usersignUp.age) {
      usersignUp.controller.errors.age = messages.error.form.age;
    }
    if (!usersignUp.confirm_password) {
      usersignUp.controller.errors.confirm_password =
        messages.error.form.confirmPassword;
    }
    if (!usersignUp.email) {
      usersignUp.controller.errors.email =
        messages.error.validation.invalidEmail;
      switchTab("tabOne");
    }
    if (!usersignUp.fname) {
      usersignUp.controller.errors.fname = messages.error.form.firstName;
      switchTab("tabOne");
    }
    if (!usersignUp.gender) {
      usersignUp.controller.errors.gender = messages.error.form.gender;
      switchTab("tabOne");
    }
    if (!usersignUp.lname) {
      usersignUp.controller.errors.lname = messages.error.form.lastName;
      switchTab("tabOne");
    }
    if (!usersignUp.password) {
      usersignUp.controller.errors.password =
        messages.error.passwordStrength.hasMinLength;
    }
    if (!usersignUp.phone) {
      usersignUp.controller.errors.phone =
        messages.error.validation.invalidPhone;
      switchTab("tabOne");
    }
    if (!usersignUp.region) {
      usersignUp.controller.errors.region = messages.error.form.region;
    }
    if (!usersignUp.role) {
      usersignUp.controller.errors.role = messages.error.form.role;
    }
  }
};

const usersignUp = reactive({
  role: "",
  fname: null,
  lname: null,
  email: null,
  phone: null,
  gender: null,
  age: "",
  region: "",
  password: null,
  confirm_password: null,
  controller: {
    isSubmitted: false,
    isSent: false,
    errors: {
      all: null,
      role: "",
      fname: null,
      lname: null,
      email: null,
      phone: null,
      gender: null,
      age: "",
      region: "",
      password: null,
      confirm_password: null,
    },
  },
});

// Watch if user has inset data
// First Name watching
watch(
  () => usersignUp.fname,
  (fname) => {
    if (fname) {
      // Validate first name
      const name = auth.isValidName(fname);
      if (!name.isMinLength) {
        usersignUp.controller.errors.fname = messages.error.form.isMinLength;
      } else if (!name.hasNoSpecialChars) {
        usersignUp.controller.errors.fname =
          messages.error.form.hasSpecialChars;
      } else if (!name.hasNoRepeatedChars) {
        usersignUp.controller.errors.fname =
          messages.error.form.hasRepeatedChars;
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
      const name = auth.isValidName(lname);
      if (!name.isMinLength) {
        usersignUp.controller.errors.lname = messages.error.form.isMinLength;
      } else if (!name.hasNoSpecialChars) {
        usersignUp.controller.errors.lname =
          messages.error.form.hasSpecialChars;
      } else if (!name.hasNoRepeatedChars) {
        usersignUp.controller.errors.lname =
          messages.error.form.hasRepeatedChars;
      } else {
        usersignUp.controller.errors.lname = null;
      }
    } else {
      usersignUp.controller.errors.lname = null;
    }
  }
);

// Email watching
watch(
  () => usersignUp.email,
  (email) => {
    if (email) {
      // Validate Email
      if (auth.isValidEmail(email)) {
        usersignUp.controller.errors.email = null;
      } else {
        usersignUp.controller.errors.email =
          messages.error.validation.invalidEmail;
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
        usersignUp.controller.errors.phone =
          messages.error.validation.invalidPhone;
      }
    } else {
      usersignUp.controller.errors.phone = null;
    }
  }
);
// role watching
watch(
  () => usersignUp.role,
  (role) => {
    // Validate Role
    if (role) {
      usersignUp.controller.errors.role = null;
    } else {
      usersignUp.controller.errors.role = messages.error.validation.role;
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
      usersignUp.controller.errors.region = messages.error.form.region;
    }
  }
);
// Age watching
watch(
  () => usersignUp.age,
  (age) => {
    // Validate Region
    if (age) {
      usersignUp.controller.errors.age = null;
    } else {
      usersignUp.controller.errors.age = messages.error.form.age;
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
      usersignUp.controller.errors.gender = messages.error.validation.gender;
    }
  }
);
// password watching
watch(
  () => usersignUp.password,
  (password) => {
    // Validate Password
    if (password.length < 6) {
      usersignUp.controller.errors.password =
        messages.error.passwordStrength.hasMinLength;
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
        usersignUp.controller.errors.confirm_password =
          messages.error.form.confirmPassword;
      } else {
        usersignUp.controller.errors.confirm_password = null;
      }
    } else {
      usersignUp.controller.errors.confirm_password = null;
    }
  }
);

// Password toggle
const showPassword = ref(false);
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
// Confirm Password toggle
const showConfirmPassword = ref(false);
const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// input tabs control

const switchTab = (tabName) => {
  if (tabName === "tabTwo") {
    if (!usersignUp.role || usersignUp.role.trim() === " ") {
      usersignUp.controller.errors.role = messages.error.form.role;
    }
    if (!usersignUp.fname || usersignUp.fname.trim() == " ") {
      usersignUp.controller.errors.fname = messages.error.form.firstName;
    }
    if (!usersignUp.lname || usersignUp.lname.trim() == "") {
      usersignUp.controller.errors.lname = messages.error.form.lastName;
    }
    if (!usersignUp.email || usersignUp.email.trim() == " ") {
      usersignUp.controller.errors.email =
        messages.error.validation.invalidEmail;
    }
    if (!usersignUp.phone || usersignUp.phone.trim() == "  ") {
      usersignUp.controller.errors.phone =
        messages.error.validation.invalidPhone;
    }
    if (!usersignUp.gender || usersignUp.gender.trim() == " ") {
      usersignUp.controller.errors.gender = messages.error.form.gender;
    }

    if (
      usersignUp.role &&
      usersignUp.fname &&
      usersignUp.lname &&
      usersignUp.email &&
      usersignUp.phone &&
      usersignUp.gender
    ) {
      inputTabs.value = tabName;
    }
  } else {
    inputTabs.value = tabName;
  }
};
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen md:container mx-auto py-4"
  >
    <div class="w-full max-w-md px-4 py-10 md:bg-white rounded-lg md:shadow-md">
      <h1 class="text-large font-bold text-center">Sign Up</h1>
      <NuxtImg
        src="/logo/logo_tie.png"
        class="w-20 h-20 mx-auto my-6"
        alt="logo"
      />
      <form
        @submit.prevent="signUp"
        @keydown.enter.prevent
        class="text-textGray md:h-[450px] h-dvh relative overflow-hidden text-extraSmall"
        :class="{
          'md:h-[550px]':
            usersignUp.controller.errors.age ||
            usersignUp.controller.errors.age ||
            usersignUp.controller.errors.fname ||
            usersignUp.controller.errors.gender ||
            usersignUp.controller.errors.lname ||
            usersignUp.controller.errors.password ||
            usersignUp.controller.errors.confirm_password,
        }"
      >
        <!-- First Input Group -->
        <div
          class="flex flex-col absolute -left-150 top-0 px-6 transition-all duration-500"
          :class="inputTabs === 'tabOne' ? 'left-0 w-full' : ''"
        >
          <!-- Select User Type -->
          <div
            class="focus-input-icon mb-2 border-b border-gray-300 focus-within:border-oceanBlue"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.role,
            }"
          >
            <div class="flex flex-col w-full items-start">
              <label
                for="role"
                class="text-oceanBlue font-semibold text-extraSmall capitalize"
                >Select User Type:</label
              >
              <select
                name="role"
                id="role"
                v-model="usersignUp.role"
                class="w-full p-2 focus:outline-none focus:ring-0"
                :class="{ 'text-textGray/40': !usersignUp.role }"
              >
                <option value="">(eg: Student, Teacher ...)</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="reasearcher">Researcher</option>
                <option value="education_stackeholder">
                  Education Stackeholder
                </option>
              </select>
            </div>

            <!-- Select User Type error message -->
            <small
              v-if="usersignUp.controller.errors.role"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.role }}
            </small>
          </div>

          <!-- First Name -->
          <div
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.fname,
            }"
          >
            <div class="flex w-full items-center">
              <input
                type="text"
                id="fname"
                v-model="usersignUp.fname"
                @keydown.space.prevent
                name="fname"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="First Name (eg: Baraka)"
              />
              <Icon
                name="lets-icons:user-box-light"
                class="h-5 w-5 text-textGray"
              />
            </div>

            <!-- First Name error message -->
            <small
              v-if="usersignUp.controller.errors.fname"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.fname }}
            </small>
          </div>

          <!-- Last Name -->
          <div
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.lname,
            }"
          >
            <div class="flex w-full items-center">
              <input
                type="text"
                id="lname"
                v-model="usersignUp.lname"
                @keydown.space.prevent
                name="lname"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Last Name ( eg: Minja )"
              />
              <Icon
                name="lets-icons:user-box-light"
                class="h-5 w-5 text-textGray"
              />
            </div>

            <!-- Last Name error message -->
            <small
              v-if="usersignUp.controller.errors.lname"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.lname }}
            </small>
          </div>

          <!-- Email -->
          <div
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.email,
            }"
          >
            <div class="flex w-full items-center">
              <input
                type="text"
                id="email"
                v-model="usersignUp.email"
                @keydown.space.prevent
                name="username"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Email (eg: example@gmail.com)"
              />
              <Icon name="mdi-light:email" class="h-5 w-5 text-textGray" />
            </div>

            <!-- Email error message -->
            <small
              v-if="usersignUp.controller.errors.email"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.email }}
            </small>
          </div>

          <!-- Phone Number -->
          <div
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.phone,
            }"
          >
            <div class="flex w-full items-center">
              <input
                type="tel"
                id="phone"
                v-model="usersignUp.phone"
                @keydown.space.prevent
                name="phone"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Phone Number (eg: 0622***722 or +255622***722)"
              />
              <Icon name="iconamoon:phone-thin" class="h-5 w-5 text-textGray" />
            </div>

            <!-- Phone Number error message -->
            <small
              v-if="usersignUp.controller.errors.phone"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.phone }}
            </small>
          </div>

          <!-- gender input radio -->
          <div
            class="mb-4 border-b border-gray-300 focus-within:border-oceanBlue py-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.gender,
            }"
          >
            <div
              class="flex md:flex-row flex-col items-center justify-start md:gap-10"
            >
              <div
                class="text-oceanBlue font-semibold text-extraSmall capitalize"
              >
                Select Gender:
              </div>

              <div class="flex items-center gap-2" id="gender">
                <div class="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    id="male"
                    value="male"
                    v-model="usersignUp.gender"
                    class="w-4 h-4 checked:bg-oceanBlue"
                  />
                  <label
                    for="male"
                    :class="{
                      'text-textGray/40': usersignUp.gender !== 'male',
                    }"
                    >Male</label
                  >
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    id="female"
                    value="female"
                    v-model="usersignUp.gender"
                    class="w-4 h-4 checked:bg-oceanBlue"
                  />
                  <label
                    for="female"
                    :class="{
                      'text-textGray/40': usersignUp.gender !== 'female',
                    }"
                    >Female</label
                  >
                </div>
              </div>
            </div>
            <!-- Gender error message -->
            <small
              v-if="usersignUp.controller.errors.gender"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.gender }}
            </small>
          </div>

          <!-- Next Button -->
          <div class="flex items-center justify-center px-2">
            <button
              type="button"
              @click="switchTab('tabTwo')"
              class="rounded-full h-8 w-auto px-4 gap-2 hover:bg-oceanBlue hover:text-white text-oceanBlue border border-oceanBlue animate-bounce-horizontal cursor-pointer transition-all duration-500 flex items-center group"
            >
              <p class="text-small group-hover:text-white">Next</p>
              <Icon
                name="f7:arrow-right"
                class="group-hover:text-white"
                size="16"
              />
            </button>
          </div>

          <!-- Already have an account -->
          <div class="mt-4 flex items-center justify-center gap-2">
            <p class="text-sm text-textGray">
              Already have an account?
              <NuxtLink
                to="/auth"
                class="w-full p-2 text-center cursor-pointer text-oceanBlue"
              >
                Sign In</NuxtLink
              >
            </p>
          </div>
        </div>

        <!-- Second Input Group -->
        <div
          class="flex flex-col absolute -right-150 top-0 px-6 transition-all duration-500"
          :class="inputTabs === 'tabTwo' ? 'right-0 w-full h-full' : ''"
        >
          <!-- Select Age -->
          <div
            class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.age,
            }"
          >
            <div class="flex flex-col">
              <label
                for="age"
                class="text-oceanBlue font-semibold text-extraSmall capitalize"
                >Select Age:</label
              >
              <select
                name="age"
                id="age"
                class="w-full p-2 focus:outline-none focus:ring-0"
                :class="{ 'text-textGray/40': !usersignUp.age }"
                v-model="usersignUp.age"
              >
                <option value="">Eg: kids(3 - 12) ...</option>
                <option value="3-12">Kids(3 - 12)</option>
                <option value="13-19">Teens(13 - 19)</option>
                <option value="20-60">Young Adults(20 - 35)</option>
                <option value="60+">Middle-Aged Adults(36 - 60)</option>
              </select>
            </div>

            <!-- Age error message -->
            <small
              v-if="usersignUp.controller.errors.age"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.age }}
            </small>
          </div>

          <!-- Select Region -->
          <div
            class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.region,
            }"
          >
            <div class="flex flex-col">
              <label
                for="region"
                class="text-oceanBlue font-semibold text-extraSmall capitalize"
                >Select Region:</label
              >
              <select
                name="region"
                id="region"
                class="w-full p-2 focus:outline-none focus:ring-0"
                :class="{ 'text-textGray/40': !usersignUp.region }"
                v-model="usersignUp.region"
              >
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
            <!-- Region error message -->
            <small
              v-if="usersignUp.controller.errors.region"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.region }}
            </small>
          </div>

          <!-- Password -->
          <div
            class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-center gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.password,
            }"
          >
            <div class="flex items-center w-full">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="usersignUp.password"
                name="password"
                autocomplete="off"
                class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Password"
              />
              <Icon
                :name="
                  showPassword
                    ? 'iconamoon:eye-off-light'
                    : 'iconamoon:eye-thin'
                "
                class="h-5 w-5 cursor-pointer text-textGray"
                @click="togglePassword"
              />
            </div>
            <!-- Password error message -->
            <small
              v-if="usersignUp.controller.errors.password"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.password }}
            </small>
          </div>

          <!-- Confirm Password -->
          <div
            class="focus-input-icon mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-center gap-2"
          >
            <div class="flex items-center justify-between w-full">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                id="confirm_password"
                v-model="usersignUp.confirm_password"
                name="confirm_password"
                autocomplete="off"
                class="w-full p-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Confirm Password"
              />
              <Icon
                :name="
                  showConfirmPassword
                    ? 'iconamoon:eye-off-light'
                    : 'iconamoon:eye-thin'
                "
                class="h-5 w-5 cursor-pointer text-textGray"
                @click="toggleConfirmPassword"
              />
            </div>
            <!-- Password error message -->
            <small
              v-if="usersignUp.controller.errors.confirm_password"
              class="text-red-500 text-smallest w-full"
            >
              {{ usersignUp.controller.errors.confirm_password }}
            </small>
          </div>

          <!-- Sign Up Button -->
          <button
            type="submit"
            class="w-full p-2 bg-oceanBlue text-white rounded-md cursor-pointer hover:bg-oceanBlue/80 transition-all duration-500"
          >
          <!-- submited successful -->
          <div class="flex items-center justify-center gap-2" v-if="usersignUp.controller.isSubmitted && usersignUp.controller.isSent">
            Submitted
            <Icon name="icons8:checked" class="h-5 w-5 cursor-pointer text-white" size="16" />
          </div>
              <div class="flex items-center justify-center gap-2" v-else-if="usersignUp.controller.isSubmitted && !usersignUp.controller.isSent">
                Sign up failed
                <Icon name="oui:cross-in-circle-empty" class="h-5 w-5 cursor-pointer text-white" size="16" />
              </div>

             <div class="flex items-center justify-center gap-2" v-else>
                 Sign Up
                 <Icon name="mynaui:send" class="h-5 w-5 cursor-pointer text-white" size="16" />
             </div> 
          </button>

          <!-- Already have an account -->
          <div class="mt-4 flex items-center justify-center gap-2 mb-10">
            <p class="text-sm text-textGray">
              Already have an account?
              <NuxtLink
                to="/auth"
                class="w-full p-2 text-center cursor-pointer text-oceanBlue"
              >
                Sign In</NuxtLink
              >
            </p>
          </div>

          <!-- Previous Button -->
          <div class="flex items-center justify-center px-2">
            <button
              type="button"
              @click="switchTab('tabOne')"
              class="rounded-full h-8 w-auto px-4 gap-2 hover:bg-oceanBlue hover:text-white text-oceanBlue border border-oceanBlue animate-bounce-horizontal cursor-pointer transition-all duration-500 flex items-center group"
            >
              <Icon
                name="f7:arrow-left"
                class="group-hover:text-white"
                size="16"
              />
              <p class="text-small group-hover:text-white">Back</p>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
