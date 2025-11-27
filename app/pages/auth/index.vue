<script setup>
import messages from "~/utilities/messages";
import { auth } from "~/utilities/validationInput";
import { sanitize } from "~/utilities/sanitizeInput";
import axios from "axios";
import apiDocs from "~/utilities/api-docs";
import { dataEncrypt, dataDecrypt } from "~/utilities/encryption";

// // Use the State
const navigationStore = useNavigationStore();
const returnPath = navigationStore.getLatestRoute();
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

  // Check for empty fields first
  if (!auth.checkEmailPhoneOrUsername(userSignIn.username.trim())) {
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
      const response = await axios.post(apiDocs.auth.login, {
        username: sanitize.input(userSignIn.username),
        password: userSignIn.password,
      });

      if (response.status >= 200 && response.status < 300) {
        userSignIn.controller.feedback = messages.success.auth.authenticated;

        // unlock button
        isDisable.value = false;

        userSignIn.controller.feedback = messages.success.auth.authenticated;
        userSignIn.controller.isSucces = true;

        const accessToken = useCookie("signInAccessToken", {
          httpOnly: false, // Accessible in browser
          secure: import.meta.env.PROD, // ✅ uses Nuxt's client env detection
          maxAge: 60 * 60 * 2, // 2 hours
          sameSite: "strict",
          path: "/",
        });

        const refreshToken = useCookie("signInRefreshToken", {
          httpOnly: false, // Accessible in browser
          secure: import.meta.env.PROD,
          maxAge: 60 * 60 * 2, // 2 hours
          sameSite: "strict",
          path: "/",
        });

        const userToken = useCookie("signInUserToken", {
          httpOnly: false, // Accessible in browser
          secure: import.meta.env.PROD,
          maxAge: 60 * 60 * 2, // 2 hours
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
          httpOnly: false, // Accessible in browser
          secure: import.meta.env.PROD,
          maxAge: 60 * 60 * 24 * 7, // 1 week
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
          userRememberMe.value = null; // Clear the cookie
        }

        accessToken.value = response.data.access_token;
        refreshToken.value = response.data.refresh_token;
        userToken.value = response.data.user;

        setTimeout(() => {
          // router
          const router = useRouter();
          if (returnPath) {
            router.replace(returnPath);
          } else {
            router.replace("/home");
          }
          // router.back();
        }, 2000);
      } else {
        userSignIn.controller.attemps++;
        isDisable.value = false;
        userSignIn.controller.feedback = messages.error.auth.invalidCredentials;
      }
    } catch (error) {
      userSignIn.controller.attemps++;
      userSignIn.controller.feedback = messages.error.auth.invalidCredentials;
      isDisable.value = false;
    }

    setTimeout(() => {
      userSignIn.controller.feedback = null;
      userSignIn.controller.isSucces = false;
    }, 2000);
  }
};

// Disable Variable
const isDisable = ref(false);

// Password toggle
const showPassword = ref(false);
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// Clear validation errors when user types
watch(
  () => userSignIn.username,
  (username) => {
    if (username) {
      if (auth.checkEmailPhoneOrUsername(username.trim())) {
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
  <section class="flex items-center justify-center min-h-screen md:bg-gradient-to-b">
    <!-- Message Component -->
    <MessageComponent :message="userSignIn.controller.feedback"
      :position="userSignIn.controller.feedback ? true : false"
      :event-type="userSignIn.controller.isSucces ? 'success' : 'error'" :icon="userSignIn.controller.isSucces
          ? 'icons8:checked'
          : 'oui:cross-in-circle-empty'
        " />

    <div class="w-full max-w-md px-4 rounded-lg md:bg-white md:shadow-2xl md:pt-3">
      <h1 class="font-bold text-center text-large">Welcome</h1>
      <NuxtLink to="/" class="w-[100px] h-[100px] mx-auto my-6 flex items-center justify-center">
        <NuxtImg src="/logo/logo_tie.gif" class="object-contain w-full h-full" alt="TIE Web Portal Logo" />
      </NuxtLink>
      <form @submit.prevent="signIn" v-if="userSignIn.controller.attemps < 3"
        class="px-4 overflow-hidden text-textGray text-extraSmall">
        <!-- Username Teacher and Stackeholder and Student -->
        <div :class="[
          'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
          {
            'focus-input-icon-warning focus-within:border-red-500 border-red-500':
              userSignIn.controller.errors.username,
          },
        ]">
          <label for="username" class="sr-only">Username (e.g., email, phone, or student name)</label>
          <div class="flex items-center w-full">
            <input type="text" id="username" v-model="userSignIn.username" name="username" autocomplete="off"
              @keydown.space.prevent :aria-invalid="!!userSignIn.controller.errors.username"
              aria-describedby="username-error"
              class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
              placeholder="(e.g. example@email.com /0622***722 /Student.Name)" />

            <Icon name="solar:user-outline" class="w-5 h-5 text-textGray" />
          </div>

          <!-- Username error message -->
          <small id="username-error" v-if="userSignIn.controller.errors.username" :class="[
            'w-full text-red-500 text-smallest',
            { 'mt-1': userSignIn.type.trim().toLowerCase() === 'student' },
            {
              'mt-1':
                userSignIn.type.trim().toLowerCase() === 'teacher' ||
                userSignIn.type.trim().toLowerCase() ===
                'education stackeholder',
            },
            { 'mt-0': userSignIn.type.trim().toLowerCase() === '' },
          ]">
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
          <div class="flex items-center w-full">
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="userSignIn.password"
              name="password" :aria-invalid="!!userSignIn.controller.errors.password" aria-describedby="password-error"
              class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
              placeholder="Password" />
            <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'
              " class="w-5 h-5 cursor-pointer text-textGray" tabindex="0" @click="togglePassword"
              @keydown.enter="togglePassword" />
          </div>

          <!-- Password error message -->
          <small id="password-error" v-if="userSignIn.controller.errors.password"
            class="w-full text-red-500 text-smallest">
            {{ userSignIn.controller.errors.password }}
          </small>
        </div>

        <div class="flex items-center justify-between my-6">
          <!-- Forgot password link -->
          <NuxtLink to="/auth/ForgotPassword"
            class="text-sm cursor-pointer text-textGray underline-offset-2 hover:underline">
            Forgot password?
          </NuxtLink>

          <!-- Remember me -->
          <div class="flex items-center gap-2">
            <input type="checkbox" id="remember" v-model="userSignIn.rememberMe" class="w-4 h-4 cursor-pointer" />
            <label for="remember" class="text-sm cursor-pointer text-textGray">
              Remember me
            </label>
          </div>
        </div>

        <!-- Sign in button -->
        <button type="submit" :disabled="isDisable" :aria-disabled="isDisable ? 'true' : 'false'"
          :aria-busy="isDisable ? 'true' : 'false'"
          class="flex items-center justify-center w-full gap-3 p-2 text-white capitalize transition-all duration-500 rounded-md bg-oceanBlue disabled:bg-gray-500/40 disabled:cursor-not-allowed hover:bg-oceanBlue/80">
          <!-- Normal state -->
          <span v-if="!isDisable">
            Sign in
          </span>

          <!-- Loading state -->
          <span v-else class="flex items-center gap-2">
            <span>Signing in…</span>
            <Icon name="eos-icons:loading" class="text-white animate-spin" size="20" aria-hidden="true" />
          </span>
        </button>

        <!-- Sign up -->
        <div class="flex flex-col items-center gap-4 my-4">
          <p class="text-sm text-textGray">Don't have an account?</p>
          <NuxtLink to="/auth/SignUp"
            class="w-full p-2 text-center text-white capitalize transition-all duration-500 rounded-md cursor-pointer bg-darkBlue hover:bg-darkBlue/80">
            Sign up
          </NuxtLink>
        </div>
      </form>

      <!-- Too many attempts state -->
      <div v-else class="flex flex-col items-center justify-center w-full gap-2" aria-live="polite">
        <div class="py-3 text-center">
          You have attempted to sign in
          <span class="text-oceanBlue">
            {{ userSignIn.controller.attemps }}
          </span>
          times. Please reset your password or register a new account.
        </div>

        <NuxtLink to="/auth/ForgotPassword"
          class="flex items-center justify-center w-full p-2 text-white capitalize rounded-md cursor-pointer bg-oceanBlue hover:bg-oceanBlue/80">
          Reset your password
        </NuxtLink>

        <span>or</span>

        <NuxtLink to="/auth/SignUp"
          class="flex items-center justify-center w-full p-2 mb-3 text-white capitalize rounded-md cursor-pointer bg-oceanBlue hover:bg-oceanBlue/80">
          Register a new account
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
