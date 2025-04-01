<script setup>
import apiDocs from "~/utilities/api-docs";
import messages from "~/utilities/messages";
import { sanitize } from "~/utilities/sanitizeInput";
import { auth } from "~/utilities/validationInput";
import axios from 'axios'
import { generateRandomID } from "~/utilities/generateRandomNumber";

// input tabs control
const inputTabs = ref("tabOne");


const usersignUp = reactive({
  type: "",
  fname: null,
  lname: null,
  email: null,
  phone: null,
  gender: null,
  userName: null,
  age: "",
  region: "",
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
      school: null,
      district: null,
      organization: null,
      userOrgRole: null,
      otherRole: null,
      userExist: null,
    },
  },
});

const signUp = async () => {
  if (usersignUp.userOrgRole.toLowerCase().trim() == 'others' && usersignUp.otherRole) {
    usersignUp.userOrgRole = usersignUp.otherRole
  }

  if (
    usersignUp.age &&                                     // Age must be greater than 0
    usersignUp.confirm_password?.trim() &&                // Confirm password is required
    usersignUp.fname?.trim() &&                           // First name is required
    usersignUp.lname?.trim() &&                           // Last name is required
    usersignUp.gender?.trim() &&                          // Gender is required
    usersignUp.password?.trim() &&                        // Password is required
    usersignUp.password === usersignUp.confirm_password && // Passwords must match
    usersignUp.region?.trim() &&                          // Region is required
    usersignUp.type?.trim() &&                            // User type is required
    usersignUp.district?.trim() &&                        // District is required

    // If not an "Education Stakeholder", user must provide their school
    (usersignUp.type.toLowerCase().trim() !== 'education stackeholder' && usersignUp.school?.trim()) ||

    // If user is an "Education Stakeholder", they must provide organization and role
    (usersignUp.type.toLowerCase().trim() === 'education stackeholder' &&
      usersignUp.organization?.trim() && usersignUp.userOrgRole?.trim()) &&

    // Either user is not "Student"  they must provide both email and phone
    (usersignUp.type.toLowerCase().trim() !== 'student' && (usersignUp.email?.trim() && usersignUp.phone?.trim()))
  ) {

    // 
    usersignUp.controller.isSent = 'pending';
    usersignUp.controller.isSubmitted = true;
    // user role other,

    // submit data
    await axios.post(apiDocs.auth.signUp,
      usersignUp.type.toLowerCase().trim() == 'student' ?
        {
          name: sanitize.input(usersignUp.fname + " " + usersignUp.lname),
          password: usersignUp.password,
          type: usersignUp.type,
          gender: usersignUp.gender,
          region: usersignUp.region,
          school: usersignUp.school && usersignUp.school.trim() !== '' ? usersignUp.school : null,
          district: usersignUp.district,
          ageGroup: usersignUp.age,
          terms: true,
          username: usersignUp.userName && usersignUp.userName.trim() !== '' ? usersignUp.userName : null,
        }
        :
        usersignUp.type.toLowerCase().trim() == 'teacher' ?

        {
          name: sanitize.input(usersignUp.fname + " " + usersignUp.lname),
          password: usersignUp.password,
          phoneNumber: usersignUp.phone ? sanitize.input(usersignUp.phone[0] == 0 ? String(usersignUp.phone).slice(1) : String(usersignUp.phone).slice(4)) : null,
          type: usersignUp.type,
          email: usersignUp.email ? sanitize.input(usersignUp.email) : null,
          gender: usersignUp.gender,
          region: usersignUp.region,
          school: usersignUp.school && usersignUp.school.trim() !== '' ? usersignUp.school : null,
          district: usersignUp.district,
          ageGroup: usersignUp.age,
          terms: true,
        }
        :
        {
          name: sanitize.input(usersignUp.fname + " " + usersignUp.lname),
          password: usersignUp.password,
          phoneNumber: usersignUp.phone ? sanitize.input(usersignUp.phone[0] == 0 ? String(usersignUp.phone).slice(1) : String(usersignUp.phone).slice(4)) : null,
          type: usersignUp.type,
          email: usersignUp.email ? sanitize.input(usersignUp.email) : null,
          gender: usersignUp.gender,
          region: usersignUp.region,
          school: usersignUp.school && usersignUp.school.trim() !== '' ? usersignUp.school : null,
          district: usersignUp.district,
          ageGroup: usersignUp.age,
          terms: true,
          organization: usersignUp.organization,
          role: usersignUp.userOrgRole && usersignUp.userOrgRole.trim() !== '' ? usersignUp.userOrgRole : null,
        }
    )
      .then((response) => {
        if (response.status >= 200 && response.status < 300) {
          usersignUp.controller.isSent = 'success';
          usersignUp.controller.feedback = messages.success.auth.registered;
          setTimeout(() => {
            // router
            const router = useRouter()
            router.push('/auth');
          }, 5000)

        } else {
          usersignUp.controller.isSent = 'failed';

          // Check both student and Stakeholder and teacher already Exist
          if (usersignUp.type.toLowerCase().trim() === 'student') {
            usersignUp.controller.feedback = messages.error.auth.userExist;
          } else {
            usersignUp.controller.feedback = messages.error.auth.accountExists;
          }
        }

      })
      .catch((error) => {
        usersignUp.controller.isSent = 'error';
        const errorMessage = JSON.stringify(error?.response?.data?.errors);
        console.log('Error Message: ', errorMessage);
        if (error.response) {
          // The request was made, but the server responded with a status code
          switch (error.response.status) {
            case 400:
              usersignUp.controller.feedback = "Bad request. Please check your input.";
              break;
            case 401:
              usersignUp.controller.feedback = "Unauthorized access. Please log in.";
              break;
            case 403:
              usersignUp.controller.feedback = "Forbidden. You do not have permission.";
              break;
            case 404:
              usersignUp.controller.feedback = "Requested resource not found.";
              break;
            case 422:
              if (errorMessage.includes('email')) {
                usersignUp.controller.feedback = 'This email already exists.';
              } else if (errorMessage.includes('phone')) {
                usersignUp.controller.feedback = 'This phone number is already registered.';
              } else if (errorMessage.includes('username')) {
                usersignUp.controller.feedback = 'This username is already taken.';
              } else {
                usersignUp.controller.feedback = 'An unexpected error occurred. Please try again.';
              }
              break;
            case 500:
              usersignUp.controller.feedback = "Internal server error. Please try again later.";
              break;
            case 503:
              usersignUp.controller.feedback = "Service unavailable. Server is currently down.";
              break;
            default:

              usersignUp.controller.feedback = 'An unexpected error occurred. Please try again.';
          }
        } else if (error.request) {
          // The request was made but no response was received
          usersignUp.controller.feedback = "No response from the server. Please check your internet connection.";
        } else {
          // Something else went wrong in setting up the request
          usersignUp.controller.feedback = "Request failed due to an unknown error.";
        }
      });


    setTimeout(() => {
      usersignUp.controller.isSent = null;
      usersignUp.controller.feedback = null;
    }, 5000)

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
    }
    if (!usersignUp.region) {
      usersignUp.controller.errors.region = messages.error.form.region;
    }
    if (!usersignUp.type) {
      usersignUp.controller.errors.type = messages.error.form.type;
    }
  }
};

// check user exists in records
const userExists = async () => {
  try {
    const response = await $fetch(apiDocs.auth.userExists, {
      method: "POST",
      body: {
        username: usersignUp.userName,
      }
    });

    if (response === 'true') {
      usersignUp.controller.userExists = true;
      usersignUp.controller.errors.userName = messages.error.auth.userExist;

      //Generate randomly number
      usersignUp.userName = usersignUp.fname + "." + usersignUp.lname + generateRandomID();

      userExists();
    } else {
      usersignUp.controller.userExists = false;
      usersignUp.controller.errors.userName = null;
    }
  } catch (error) {
    usersignUp.controller.userExists = true;
    usersignUp.controller.feedback = messages.error.server.internalError;
  }
}

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

// user name watching
watch(
  () => usersignUp.userName,
  (username) => {
    if (username) {
      if (!auth.checkEmailPhoneOrUsername(username)) {
        usersignUp.controller.errors.userName = messages.error.auth.invalidUserName;
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
// type watching
watch(
  () => usersignUp.type,
  (type) => {
    // Validate type
    if (type) {
      usersignUp.controller.errors.type = null;
    } else {
      usersignUp.controller.errors.type = messages.error.validation.type;
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

// School watching
watch(
  () => usersignUp.school, (school) => {
    if (school) {
      usersignUp.controller.errors.school = null;
    } else {
      usersignUp.controller.errors.school = messages.error.form.school;
    }
  }
);

// password watching
watch(
  () => usersignUp.password,
  (password) => {
    // Validate Password
    if (password) {
      if (password.length < 6) {
        usersignUp.controller.errors.password =
          messages.error.passwordStrength.hasMinLength;
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
const switchTab = (tabName) => {
  if (tabName === "tabTwo") {

    if (!usersignUp.type || usersignUp.type.trim() === " ") {
      usersignUp.controller.errors.type = messages.error.form.type;
    }
    if (!usersignUp.fname || usersignUp.fname.trim() == " ") {
      usersignUp.controller.errors.fname = messages.error.form.firstName;
    }
    if (!usersignUp.lname || usersignUp.lname.trim() == "") {
      usersignUp.controller.errors.lname = messages.error.form.lastName;
    }

    if (!usersignUp.gender || usersignUp.gender.trim() == " ") {
      usersignUp.controller.errors.gender = messages.error.form.gender;
    }

    if (!usersignUp.region || usersignUp.region.trim() == " ") {
      usersignUp.controller.errors.region = messages.error.form.region;
    }
    if (!usersignUp.district || usersignUp.district.trim() == " ") {
      usersignUp.controller.errors.district = messages.error.form.district;
    }

    // school for student and teacher
    if ((!usersignUp.school || usersignUp.school.trim() == " ") &&
      (usersignUp.type.toLowerCase() === "student" || usersignUp.type.toLowerCase() === "teacher")) {
      usersignUp.controller.errors.school = messages.error.form.school;
      return;
    }

    if (
      usersignUp.type &&
      usersignUp.fname &&
      usersignUp.lname &&
      usersignUp.gender &&
      usersignUp.region &&
      usersignUp.district ||
      usersignUp.school
    ) {
      usersignUp.userName = usersignUp.fname + "." + usersignUp.lname;

      // One-liner equivalent to the if statement, use a logical && operator:
      usersignUp.type.toLowerCase().trim() === 'student' && userExists();

      // if (usersignUp.type.toLowerCase().trim() === 'student') {
      //   userExists();
      // }

      inputTabs.value = tabName;
    }
  } else {
    inputTabs.value = tabName;
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen py-2 md:bg-gradient-to-b">

    <!-- Message Component -->
    <MessageComponent 
      :message="usersignUp.controller.feedback"
      :position="usersignUp.controller.feedback ? true : false" 
      :event-type="usersignUp.controller.isSent"
      :icon="usersignUp.controller.isSent == 'success' ? 'icons8:checked' : 'oui:cross-in-circle-empty'" />

    <div class="w-full max-w-md px-4 py-10 md:bg-white rounded-lg md:shadow-2xl">
      <h1 class="text-large font-bold text-center">Sign Up</h1>
      <NuxtLink to="/" class="w-25 h-25 mx-auto my-6 flex items-center justify-center">
        <NuxtImg src="/logo/logo_tie.webp" class="w-full h-full object-contain" alt="logo" />
      </NuxtLink>
      <form @submit.prevent="signUp" @keydown.enter.prevent
        class="text-textGray md:h-[500px] h-dvh relative overflow-hidden text-extraSmall" :class="[
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
        <div class="flex flex-col absolute -left-150 top-0 px-6 transition-all duration-500"
          :class="inputTabs === 'tabOne' ? 'left-0 w-full' : ''">
          <!-- Select User Type -->
          <div class="focus-input-icon mb-2 border-b border-gray-300 focus-within:border-oceanBlue" :class="{
            'focus-input-icon-warning border-red-500 focus-within:border-red-500':
              usersignUp.controller.errors.type,
          }">
            <div class="flex flex-col w-full items-start">
              <label for="type" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select User
                Type:</label>
              <select name="type" id="type" v-model="usersignUp.type" class="w-full p-1 focus:outline-none focus:ring-0"
                :class="{ 'text-textGray/40': !usersignUp.type }">
                <option value="">(eg: Student, Teacher ...)</option>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Education Stackeholder">Education Stackeholder</option>
              </select>
            </div>

            <!-- Select User Type error message -->
            <small v-if="usersignUp.controller.errors.type" class="text-red-500 text-smallest w-full">
              {{ usersignUp.controller.errors.type }}
            </small>
          </div>

          <!-- First Name -->
          <div
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.fname,
            }">
            <div class="flex w-full items-center">
              <input type="text" id="fname" v-model="usersignUp.fname" @keydown.space.prevent name="fname"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="First Name (eg: Baraka)" />
              <Icon name="lets-icons:user-box-light" class="h-5 w-5 text-textGray" />
            </div>

            <!-- First Name error message -->
            <small v-if="usersignUp.controller.errors.fname" class="text-red-500 text-smallest w-full">
              {{ usersignUp.controller.errors.fname }}
            </small>
          </div>

          <!-- Last Name -->
          <div
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.lname,
            }">
            <div class="flex w-full items-center">
              <input type="text" id="lname" v-model="usersignUp.lname" @keydown.space.prevent name="lname"
                autocomplete="off"
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Last Name ( eg: Minja )" />
              <Icon name="lets-icons:user-box-light" class="h-5 w-5 text-textGray" />
            </div>

            <!-- Last Name error message -->
            <small v-if="usersignUp.controller.errors.lname" class="text-red-500 text-smallest w-full">
              {{ usersignUp.controller.errors.lname }}
            </small>
          </div>

          <!-- region -->
          <div
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.region,
            }">
            <SelectionRegionSelection :error="usersignUp.controller.errors.region"
              @update-region="usersignUp.region = $event" />
          </div>

          <!-- District -->
          <div
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.district,
            }">
            <!-- select district -->
            <SelectionDistrictSelection :error="usersignUp.controller.errors.district" :region="usersignUp.region"
              @update-district="usersignUp.district = $event" />
          </div>

          <!-- school -->
          <div v-if="usersignUp.type.toLowerCase() === 'student' || usersignUp.type.toLowerCase() === 'teacher'"
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.school,
            }">

            <!-- select school -->
            <SelectionSchoolSelection :district="usersignUp.district" :region="usersignUp.region"
              :school="usersignUp.school" @update-school="usersignUp.school = $event"
              :error="usersignUp.controller.errors.school" />
          </div>

          <!-- gender input radio -->
          <div class="mb-4 border-b border-gray-300 focus-within:border-oceanBlue py-2" :class="{
            'focus-input-icon-warning border-red-500 focus-within:border-red-500':
              usersignUp.controller.errors.gender,
          }">
            <div class="flex md:flex-row flex-col items-center justify-start md:gap-10">
              <div class="text-oceanBlue font-semibold text-extraSmall capitalize">
                Select Sex:
              </div>

              <div class="flex items-center gap-2" id="gender">
                <div class="flex items-center gap-2">
                  <input type="radio" name="gender" id="male" value="male" v-model="usersignUp.gender"
                    class="w-4 h-4 checked:bg-oceanBlue" />
                  <label for="male" :class="{
                    'text-textGray/40': usersignUp.gender !== 'male',
                  }">Male</label>
                </div>
                <div class="flex items-center gap-2">
                  <input type="radio" name="gender" id="female" value="female" v-model="usersignUp.gender"
                    class="w-4 h-4 checked:bg-oceanBlue" />
                  <label for="female" :class="{
                    'text-textGray/40': usersignUp.gender !== 'female',
                  }">Female</label>
                </div>
              </div>
            </div>
            <!-- Gender error message -->
            <small v-if="usersignUp.controller.errors.gender" class="text-red-500 text-smallest w-full">
              {{ usersignUp.controller.errors.gender }}
            </small>
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
            <p class="text-sm text-textGray">
              Already have an account?
              <NuxtLink to="/auth" class="w-full p-1 text-center cursor-pointer text-oceanBlue">
                Sign In</NuxtLink>
            </p>
          </div>
        </div>

        <!-- Second Input Group -->
        <div class="flex flex-col absolute -right-150 top-0 px-6 transition-all duration-500"
          :class="inputTabs === 'tabTwo' ? 'right-0 w-full h-full' : ''">
          <!-- Select Age -->
          <div class="focus-input-icon mb-3 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.age,
            }">
            <div class="flex flex-col">
              <label for="age" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select Age:</label>
              <select name="age" id="age" class="w-full p-1 focus:outline-none focus:ring-0"
                :class="{ 'text-textGray/40': !usersignUp.age }" v-model="usersignUp.age">
                <option value="">Eg: {{ usersignUp.type.toLowerCase().trim() == 'student' ?'kids(3 - 12)':'Young Adults(20 - 35)' }} ...</option>
                <option v-if="usersignUp.type.toLowerCase().trim() == 'student'" value="Child">Kids(3 - 12)</option>
                <option  v-if="usersignUp.type.toLowerCase().trim() == 'student'" value="Teen">Teens(13 - 19)</option>
                <option value="YoungAdult">Young Adults(20 - 35)</option>
                <option  v-if="usersignUp.type.toLowerCase().trim() !== 'student'" value="MiddleAgedAdult">Middle-Aged Adults(36 - 60)</option>
                <option  v-if="usersignUp.type.toLowerCase().trim() !== 'student'" value="Adult">Adults(60+)</option>
              </select>
            </div>

            <!-- Age error message -->
            <small v-if="usersignUp.controller.errors.age" class="text-red-500 text-smallest w-full">
              {{ usersignUp.controller.errors.age }}
            </small>
          </div>

          <!-- Select email and phone for non student -->
          <div v-if="usersignUp.type.toLowerCase() !== 'student'">

            <!-- Email -->
            <div
              class="focus-input-icon px-2 mb-3 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
              :class="{
                'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                  usersignUp.controller.errors.email,
              }">
              <div class="flex w-full items-center">
                <input type="text" id="email" v-model="usersignUp.email" @keydown.space.prevent name="username"
                  autocomplete="off"
                  class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                  placeholder="Email (eg: example@gmail.com)" />
                <Icon name="mdi-light:email" class="h-5 w-5 text-textGray" />
              </div>

              <!-- Email error message -->
              <small v-if="usersignUp.controller.errors.email" class="text-red-500 text-smallest w-full">
                {{ usersignUp.controller.errors.email }}
              </small>
            </div>

            <!-- Phone Number -->
            <div
              class="focus-input-icon px-2 mb-3 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
              :class="{
                'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                  usersignUp.controller.errors.phone,
              }">
              <div class="flex w-full items-center">
                <input type="tel" id="phone" v-model="usersignUp.phone" @keydown.space.prevent name="phone"
                  autocomplete="off"
                  class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                  placeholder="Phone Number (eg: 0622***722 or +255622***722)" />
                <Icon name="iconamoon:phone-thin" class="h-5 w-5 text-textGray" />
              </div>

              <!-- Phone Number error message -->
              <small v-if="usersignUp.controller.errors.phone" class="text-red-500 text-smallest w-full">
                {{ usersignUp.controller.errors.phone }}
              </small>
            </div>

            <!-- organization informations for stakeholders -->
            <div class="" id="organization" v-if="usersignUp.type.toLowerCase() === 'education stackeholder'">
              <!-- org name -->
              <div
                class="focus-input-icon px-2 mb-3 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
                :class="{
                  'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                    usersignUp.controller.errors.organization,
                }">
                <div class="flex w-full items-center">
                  <input type="text" id="email" v-model="usersignUp.organization"
                    name="organization" autocomplete="off"
                    class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                    placeholder="Organization (eg: Ekima interctive company)" />
                  <Icon name="tdesign:institution" class="h-5 w-5 text-textGray" />
                </div>
                <!-- org name error message -->
                <small v-if="usersignUp.controller.errors.organization" class="text-red-500 text-smallest w-full">
                  {{ usersignUp.controller.errors.organization }}
                </small>
              </div>
              <!-- stakeholder role -->
              <div class="focus-input-icon mb-3 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col"
                :class="{
                  'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                    usersignUp.controller.errors.age,
                }">
                <div class="flex flex-col">
                  <label for="userOrgRole" class="text-oceanBlue font-semibold text-extraSmall capitalize">Select role
                    in your Organization:</label>
                  <select name="userOrgRole" id="userOrgRole" class="w-full p-1 focus:outline-none focus:ring-0"
                    :class="{ 'text-textGray/40': !usersignUp.userOrgRole }" v-model="usersignUp.userOrgRole">
                    <option value="">Eg: ( Manager ) ...</option>
                    <option value="Reseacher">Reseacher</option>
                    <option value="School Admin | Owner">School Admin | Owner</option>
                    <option value="School Manager">School Manager</option>
                    <option value="Educationalist">Educationalist</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <!-- Age error message -->
                <small v-if="usersignUp.controller.errors.userOrgRole" class="text-red-500 text-smallest w-full">
                  {{ usersignUp.controller.errors.userOrgRole }}
                </small>
              </div>

              <!-- other user role in their org -->
              <div v-if="usersignUp.userOrgRole.toLowerCase() === 'others'"
                class="focus-input-icon px-2 mb-3 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
                :class="{
                  'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                    usersignUp.controller.errors.userOrgRole,
                }">
                <div class="flex w-full items-center">
                  <input type="text" id="userOrgRole" v-model="usersignUp.otherRole" @keydown.space.prevent
                    name="organization" autocomplete="off"
                    class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                    placeholder="Please specify role in your organization" />
                  <Icon name="mdi-light:shield" class="h-5 w-5 text-textGray" />
                </div>
                <!-- org name error message -->
                <small v-if="usersignUp.controller.errors.otherRole" class="text-red-500 text-smallest w-full">
                  {{ usersignUp.controller.errors.otherRole }}
                </small>
              </div>
            </div>
          </div>

          <!-- username student -->
          <div v-if="usersignUp.type.toLowerCase() === 'student'"
            class="focus-input-icon px-2 mb-4 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-start justify-start gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.userName,
            }">
            <div class="flex w-full items-center">
              <input type="text" id="userName" v-model="usersignUp.userName" @keydown.space.prevent name="userName"
                autocomplete="off"
                readonly
                class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Username (eg: Baraka.Minja)" />
              <Icon name="lets-icons:user-box-light" class="h-5 w-5 text-textGray" />
            </div>

            <!-- username error message -->
            <small v-if="usersignUp.controller.errors.userName" class="text-red-500 text-smallest w-full">
              {{ usersignUp.controller.errors.userName }}
            </small>
          </div>

          <!-- Password -->
          <div
            class="focus-input-icon mb-3 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-center gap-2"
            :class="{
              'focus-input-icon-warning border-red-500 focus-within:border-red-500':
                usersignUp.controller.errors.password,
            }">
            <div class="flex items-center w-full">
              <input :type="showPassword ? 'text' : 'password'" id="password" v-model="usersignUp.password"
                name="password" autocomplete="off"
                class="w-full p-1 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Password" />
              <Icon :name="showPassword
                ? 'iconamoon:eye-off-light'
                : 'iconamoon:eye-thin'
                " class="h-5 w-5 cursor-pointer text-textGray" @click="togglePassword" />
            </div>
            <!-- Password error message -->
            <small v-if="usersignUp.controller.errors.password" class="text-red-500 text-smallest w-full">
              {{ usersignUp.controller.errors.password }}
            </small>
          </div>

          <!-- Confirm Password -->
          <div
            class="focus-input-icon mb-3 border-b border-gray-300 focus-within:border-oceanBlue flex flex-col items-center gap-2">
            <div class="flex items-center justify-between w-full">
              <input :type="showConfirmPassword ? 'text' : 'password'" id="confirm_password"
                v-model="usersignUp.confirm_password" name="confirm_password" autocomplete="off"
                class="w-full p-1 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
                placeholder="Confirm Password" />
              <Icon :name="showConfirmPassword
                ? 'iconamoon:eye-off-light'
                : 'iconamoon:eye-thin'
                " class="h-5 w-5 cursor-pointer text-textGray" @click="toggleConfirmPassword" />
            </div>
            <!-- Password error message -->
            <small v-if="usersignUp.controller.errors.confirm_password" class="text-red-500 text-smallest w-full">
              {{ usersignUp.controller.errors.confirm_password }}
            </small>
          </div>

          <!-- Sign Up Button -->
          <button type="submit"
            class="w-full p-2 bg-oceanBlue text-white rounded-md cursor-pointer hover:bg-oceanBlue/80 transition-all duration-500">
            <!-- submited successful -->
            <div class="flex items-center justify-center gap-2"
              v-if="usersignUp.controller.isSent === 'success' && usersignUp.controller.isSubmitted">
              Submitted
              <Icon name="icons8:checked" class="h-5 w-5 cursor-pointer text-white" size="16" />
            </div>
            <div class="flex items-center justify-center gap-2"
              v-else-if="usersignUp.controller.isSent === 'pending' && usersignUp.controller.isSubmitted">
              Please Wait
              <Icon name="eos-icons:loading" class="h-5 w-5 cursor-pointer text-white" size="16" />
            </div>

            <div class="flex items-center justify-center gap-2"
              v-else-if="usersignUp.controller.isSent === 'failed' && usersignUp.controller.isSubmitted">
              Failed
              <Icon name="oui:cross-in-circle-empty" class="h-5 w-5 cursor-pointer text-white" size="16" />
            </div>
            <div class="flex items-center justify-center gap-2"
              v-else-if="usersignUp.controller.isSent === 'error' && usersignUp.controller.isSubmitted">
              Internal Error
              <Icon name="oui:cross-in-circle-empty" class="h-5 w-5 cursor-pointer text-white" size="16" />
            </div>
            <div class="flex items-center justify-center gap-2" v-else>
              Sign Up
              <Icon name="mynaui:send" class="h-5 w-5 cursor-pointer text-white" size="16" />
            </div>
          </button>

          <!-- Already have an account -->
          <div class="mt-4 flex items-center justify-center gap-2 mb-4">
            <p class="text-sm text-textGray">
              Already have an account?
              <NuxtLink to="/auth" class="w-full p-1 text-center cursor-pointer text-oceanBlue">
                Sign In</NuxtLink>
            </p>
          </div>

          <!-- Previous Button -->
          <div class="flex items-center justify-center px-2 ">
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
