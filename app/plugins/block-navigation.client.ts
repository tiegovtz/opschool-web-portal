export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  const navigationStore = useNavigationStore();

  // Routes someone cannot access if NOT signed in
  const blockedBeforeLogin = [
    "/tie-ai-teacher",
  ];

  router.beforeEach((to, from) => {
    const user = useCookie("signInUserToken");

    // 🔒 1. Not logged in → block protected pages
    if (!user.value) {
      if (blockedBeforeLogin.includes(to.path)) {
        return "/auth"; // or wherever your login page is
      }
      return true;
    }

    // 🔓 2. Logged-in logic
    const routesStates = navigationStore.getLatestRoute();
    const allowList = [
      "/profile",
      "/feedback",
      "/smart-class",
      "/smart-class/screen/live-view",
      "/smart-class/screen/live-tv",
      "/smart-class/screen/recorded-sessions",
      "/smart-class/screen/live-classes",
      "/smart-class/screen/upcoming-classes",
      "/tie-ai-teacher",
      "/home#content-container-after-login",
    ];

    if (allowList.includes(to.fullPath)) return true;

    if (!routesStates && to.fullPath !== "/home") {
      return "/home";
    }

    return true;
  });
});
