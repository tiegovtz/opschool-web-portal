<script setup>
import messages from "~/utilities/messages";
import { auth } from "~/utilities/validationInput";
import { sanitize } from "~/utilities/sanitizeInput";
import apiDocs from "~/utilities/apiDocs";
import { dataEncrypt, dataDecrypt } from "~/utilities/encryption";
import { useNavigationStore } from "~/stores/navigationStore";
import { useAuthStore } from "~/stores/auth";

// // Use the State
const navigationStore = useNavigationStore();
const returnPath = navigationStore.getLatestRoute();
const route = useRoute();
const userRememberMe = useCookie("userRememberMe");
const pass = userRememberMe?.value?.password?.length > 0 ? dataDecrypt(userRememberMe?.value?.password) : null
useCookie("signInUserToken").value ? useCookie("signInUserToken").value = null : '';
useCookie("signInAccessToken").value ? useCookie("signInAccessToken").value = null : '';

// User Sign In Function
const userSignIn = reactive({
  type: "",
  status: "idle",
  username: userRememberMe.value?.username ?? null,
  password: pass ?? null,
  rememberMe: userRememberMe.value?.rememberMe ?? false,
  controller: {
    isSubmitted: false,
    isSucces: false,
    feedback: null,
    attemps: 0,
    errors: {
      username: "",
      password: "",
      type: "",
    },
  },
});

// Sign In Function
const signIn = async () => {
  // Reset error messages first
  userSignIn.controller.errors.username = "";
  userSignIn.controller.errors.password = "";

  let isValid = true;

  // Check for empty fields first - safely handle null/undefined username
  const username = (userSignIn.username || "").trim();
  if (!username || !auth.checkEmailPhoneOrUsername(username)) {
    userSignIn.controller.errors.username = messages.error.form.usernameValid;
    isValid = false;
  }

  if (!userSignIn.password) {
    userSignIn.controller.errors.password =
      messages.error.form.passwordRequired;
    isValid = false;
  }

  if (isValid) {
    // Form is valid, proceed with submission
    isDisable.value = true;
    if (userSignIn.controller.attemps == 3) {
      return;
    }

    // send data
    try {
      // const response = await axios.post(apiDocs.auth.login, {
      //   username: sanitize.input(userSignIn.username),
      //   password: userSignIn.password,
      // });


      const response = await $fetch(apiDocs.auth.login,
        {
          method: 'POST',
          body: JSON.stringify({
            username: sanitize.input(userSignIn.username),
            password: userSignIn.password,
          })
        }
      );

      userSignIn.controller.feedback = messages.success.auth.authenticated;

      // unlock button
      isDisable.value = false;

      userSignIn.controller.feedback = messages.success.auth.authenticated;
      userSignIn.controller.isSucces = true;

      const accessToken = useCookie("signInAccessToken", {
        httpOnly: false,              // Accessible in browser
        secure: import.meta.env.PROD, // uses Nuxt's client env detection
        maxAge: 60 * 60 * 2,          // 2 hours
        sameSite: "strict",
        path: "/",
      });

      const refreshToken = useCookie("signInRefreshToken", {
        httpOnly: false,              // Accessible in browser
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 2,          // 2 hours
        sameSite: "strict",
        path: "/",
      });

      const userToken = useCookie("signInUserToken", {
        httpOnly: false,              // Accessible in browser
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 2,          // 2 hours
        sameSite: "strict",
        path: "/",
        default: () => ({}),
        encode: (value) => JSON.stringify(value),
        decode: (value) => {
          try {
            return JSON.parse(value);
          } catch (e) {
            return {};
          }
        },
      });

      // create user remember me cookie
      const userRememberMe = useCookie("userRememberMe", {
        httpOnly: false,                  // Accessible in browser
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 24 * 7,         // 1 week
        sameSite: "strict",
        path: "/",
        default: () => null,
        encode: (value) => JSON.stringify(value),
        decode: (value) => {
          try {
            return JSON.parse(value);
          } catch (e) {
            return null;
          }
        },
      });

      if (userSignIn.rememberMe) {
        userRememberMe.value = {
          username: userSignIn.username,
          password: dataEncrypt(userSignIn.password),
          rememberMe: userSignIn.rememberMe,
        };
      } else {
        userRememberMe.value = null;      // Clear the cookie
      }

      accessToken.value = response.access_token;
      refreshToken.value = response.refresh_token;
      userToken.value = response.user;
      useAuthStore().setToken(accessToken.value);
      
      // Navigate to the intended page after login
      const router = useRouter();
      const redirectPath =
        typeof route.query.redirect === "string" && route.query.redirect.length > 0
          ? route.query.redirect
          : returnPath;
      router.replace(redirectPath || "/home");
    } catch (error) {
      userSignIn.controller.attemps++;
      userSignIn.controller.feedback = messages.error.auth.invalidCredentials;
      isDisable.value = false;

      console.error("[Auth Error]:", error);

    }
  }
};

// Disable Variable
const isDisable = ref(false);
const headingRef = ref(null);

// Password toggle
const showPassword = ref(false);
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

onMounted(() => {
  // Move focus to the heading when the sign-in page mounts
  headingRef.value?.focus();
});

// Clear validation errors when user types
watch(
  () => userSignIn.username,
  (username) => {
    if (username) {
      const trimmedUsername = username.trim();
      if (trimmedUsername && auth.checkEmailPhoneOrUsername(trimmedUsername)) {
        userSignIn.controller.errors.username = "";
      } else {
        userSignIn.controller.errors.username =
          messages.error.form.usernameValid;
      }
    } else {
      userSignIn.controller.errors.username = null;
    }
  }
);

watch(
  () => userSignIn.password,
  (password) => {
    if (password) {
      userSignIn.controller.errors.password = "";
    } else {
      userSignIn.controller.errors.password = null;
    }
  }
);
</script>

<template>
  <section class="flex items-center justify-center min-h-screen md:bg-gradient-to-b" aria-labelledby="signin-paging">
    <!-- Message Component (announce feedback changes) -->
    <MessageComponent aria-live="assertive" role="status" :message="userSignIn.controller.feedback"
      :position="!!userSignIn.controller.feedback" :event-type="userSignIn.controller.isSucces ? 'success' : 'error'"
      :icon="userSignIn.controller.isSucces ? 'icons8:checked' : 'oui:cross-in-circle-empty'" />

    <div class="w-full max-w-md px-4 rounded-lg md:bg-white md:shadow-2xl md:pt-3">
      <!-- Main heading for this view -->
      <h1 id="Welcome" ref="headingRef" tabindex="-1" class="font-bold text-center text-large">
        Welcome
      </h1>

      <NuxtLink aria-label="press to go home.The link contain TIE logo" to="/" class="w-[100px] h-[100px] mx-auto my-6 flex items-center justify-center">
        <img tabindex="0" src="/logo/logo_tie.gif" class="object-contain w-full h-full"
          alt="An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text ‘Taasisi ya Elimu Tanzania.’ At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text ‘Elimu ni Kazi." />
      </NuxtLink>

      <!-- Sign in form -->
      <form v-if="userSignIn.controller.attemps < 3" @submit.prevent="signIn" autocomplete="off"
        class="px-4 overflow-hidden text-textGray text-extraSmall" aria-describedby="signin-helper">
        <!-- Helper text (optional, can be expanded) -->
        <p id="signin-helper" class="sr-only">
          Enter your username and password to sign in. Required fields are username and password.
        </p>

        <!-- Username -->
        <div :class="[
          'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
          {
            'focus-input-icon-warning focus-within:border-red-500 border-red-500':
              userSignIn.controller.errors.username,
          },
        ]">
          <label for="username" class="sr-only">
            Username (e.g., email, phone, or student name)
          </label>

          <div class="flex items-center w-full">
            <input id="username" type="text" v-model="userSignIn.username" name="username" autocomplete="username"
              :aria-invalid="!!userSignIn.controller.errors.username" aria-describedby="username-error"
              class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
              placeholder="(e.g. example@email.com / 0622***722 / Student.Name)" />
            <Icon name="solar:user-outline" class="w-5 h-5 text-textGray" aria-hidden="true" focusable="false" />
          </div>

          <!-- Username error message -->
          <small aria-live="assertive" aria-atomic id="username-error" v-if="userSignIn.controller.errors.username" :class="[
            'w-full text-red-500 text-smallest',
            { 'mt-1': userSignIn.type.trim().toLowerCase() === 'student' },
            {
              'mt-1':
                userSignIn.type.trim().toLowerCase() === 'teacher' ||
                userSignIn.type.trim().toLowerCase() === 'education stackeholder',
            },
            { 'mt-0': userSignIn.type.trim().toLowerCase() === '' },
          ]" role="alert">
            {{ userSignIn.controller.errors.username }}
          </small>
        </div>

        <!-- Password -->
        <div :class="[
          'flex flex-col items-start justify-between px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
          {
            'focus-input-icon-warning focus-within:border-red-500 border-red-500':
              userSignIn.controller.errors.password,
          },
        ]">
          <label for="password" class="sr-only">Password</label>

          <div class="flex items-center w-full gap-2">
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="userSignIn.password"
              name="password" autocomplete="current-password" aria-describedby="password-error"
              :aria-invalid="!!userSignIn.controller.errors.password" placeholder="Password"
              class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs" />

            <!-- Proper button for toggling password visibility -->
            <button type="button" class="p-1 rounded text-textGray focus:outline-none focus:ring-2 focus:ring-oceanBlue"
              :aria-pressed="showPassword ? 'true' : 'false'"
              :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="togglePassword">
              <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'" class="w-5 h-5"
                aria-hidden="true" />
            </button>
          </div>

          <!-- Password error message -->
          <small aria-live="assertive" aria-atomic id="password-error" v-if="userSignIn.controller.errors.password"
            class="w-full text-red-500 text-smallest" role="alert">
            {{ userSignIn.controller.errors.password }}
          </small>
        </div>

        <!-- Forgot / Remember -->
        <div class="flex items-center justify-between my-6">
          <NuxtLink to="/auth/ForgotPassword"
            class="text-sm cursor-pointer text-textGray underline-offset-2 hover:underline">
            Forgot password?
          </NuxtLink>

          <div class="flex items-center gap-2">
            <input type="checkbox" id="remember" v-model="userSignIn.rememberMe" class="w-4 h-4 cursor-pointer" />
            <label for="remember" class="text-sm cursor-pointer text-textGray">
              Remember me
            </label>
          </div>
        </div>

        <!-- Sign in button -->
        <button type="submit" :disabled="isDisable" :aria-disabled="isDisable ? 'true' : 'false'"
          class="flex items-center justify-center w-full gap-3 p-2 text-white capitalize transition-all duration-500 rounded-md bg-oceanBlue disabled:bg-gray-500/40 disabled:cursor-not-allowed hover:bg-oceanBlue/80">
          <span v-if="!isDisable">Sign in</span>
          <span v-else>Signing in, please wait</span>
        </button>

        <p class="sr-only" role="status" aria-live="assertive" aria-atomic="true">
          {{ isDisable ? 'Signing in, please wait...' : '' }}
        </p>

        <!-- Sign up -->
        <div class="flex flex-col items-center gap-4 my-4">
          <p class="text-sm text-textGray">Don&apos;t have an account?</p>
          <NuxtLink to="/auth/SignUp"
            class="w-full p-2 text-center text-white capitalize transition-all duration-500 rounded-md cursor-pointer bg-darkBlue hover:bg-darkBlue/80">
            Sign up
          </NuxtLink>
        </div>
      </form>

      <!-- Too many attempts state -->
      <div v-else class="flex flex-col items-center justify-center w-full gap-2" aria-live="assertive" role="alert"
        aria-label="sign in error">
        <div class="py-3 text-center">
          You have attempted to sign in
          <span class="text-oceanBlue">
            {{ userSignIn.controller.attemps }}
          </span>
          times. Please reset your password or register a new account.
        </div>

        <NuxtLink aria-label="Visit to reset your password page, if you dont remember the password"
          to="/auth/ForgotPassword"
          class="flex items-center justify-center w-full p-2 text-white capitalize rounded-md cursor-pointer bg-oceanBlue hover:bg-oceanBlue/80">
          Reset your password
        </NuxtLink>

        <span>or</span>

        <NuxtLink aria-label="visit registration page, if you dont have " to="/auth/SignUp"
          class="flex items-center justify-center w-full p-2 mb-3 text-white capitalize rounded-md cursor-pointer bg-oceanBlue hover:bg-oceanBlue/80">
          Register a new account
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
