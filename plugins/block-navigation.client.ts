export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  const navigationStore = useNavigationStore();
  router.beforeEach((to, from) => {
    const user = useCookie("signInUserToken");

    // User must be logged in
    if (!user.value) return true; // allow navigation if not logged in

    // Check route state
    const routesStates = navigationStore.getLatestRoute();
    const allowList = ["/profile", "/feedback", "/smart-class","/smart-class/screen/live-view","/smart-class/screen/live-tv","/smart-class/screen/recorded-sessions", "/smart-class/screen/live-classes","/smart-class/screen/upcoming-classes"];

    // If no page state and not navigating to /home, redirect to /home
    if (allowList.includes(to.fullPath)) return true;
    else if (!routesStates && to.fullPath !== "/home") {
      return "/home";
    }

    // else if(routesStates &&  from.fullPath == routesStates && to.fullPath !== '/home'){
    //       return '/home';
    // }

    return true; // allow navigation
  });
});
