import { useNavigationStore } from "~/stores/navigationStore";

export default defineNuxtPlugin({
  name: "block-navigation",
  dependsOn: ["pinia"],
  setup(nuxtApp) {
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
      "/smart-class?header-less",
       "/smart-class/screen/live-view?header-less",
      "/smart-class/screen/live-tv?header-less",
      "/smart-class/screen/recorded-sessions?header-less",
      "/smart-class/screen/live-classes?header-less",
      "/smart-class/screen/upcoming-classes?header-less",
       "/smart-class",
       "/smart-class/screen/live-view",
      "/smart-class/screen/live-tv",
      "/smart-class/screen/recorded-sessions",
      "/smart-class/screen/live-classes",
      "/smart-class/screen/upcoming-classes",        
      "/tie-ai-teacher",
      "/home#content-container-after-login",
      "/conversation-practice",
    ];

    if (allowList.includes(to.fullPath)) return true;

    // Allow direct navigation to content pages (video, interactive, audio, experiments)
    // These routes follow the pattern: /{type}/{subject}/{level}/{topic}/{id}
    const contentRoutePattern = /^\/(video|interactive|audio|experiments)\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/;
    if (contentRoutePattern.test(to.path)) {
      // Set the navigation store based on the route type for consistency
      const routeType = to.path.split('/')[1];
      const routePath = to.path;
      
      if (routeType === 'video') {
        navigationStore.setVideo(routePath);
      } else if (routeType === 'interactive') {
        navigationStore.setTopic(routePath);
      } else if (routeType === 'audio') {
        navigationStore.setAudio(routePath);
      } else if (routeType === 'experiments') {
        navigationStore.setExperiment(routePath);
      }
      
      return true;
    }

    if (!routesStates && to.fullPath !== "/home") {
      return "/home";
    }

    return true;
    });
  },
});
