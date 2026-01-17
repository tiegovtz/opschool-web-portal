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
    "/admin",
  ];

    router.beforeEach((to, from) => {
      const user = useCookie("signInUserToken");

    // 🔒 1. Not logged in → block protected pages
    if (!user.value) {
      // Check if route starts with any blocked path (for nested routes like /admin/video-interactions)
      const isBlocked = blockedBeforeLogin.some(blockedPath => 
        to.path === blockedPath || to.path.startsWith(blockedPath + '/')
      );
      
      if (isBlocked) {
        return "/auth"; // Redirect to login page
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
      "/english-practice",
      "/interactive-video",
      "/list-videos",
      "/home#content-container-after-login",
      "/admin",
      "/admin/video-interactions",
    ];

    // Check if the base path (without query params) is in the allowlist
    const basePath = to.path
    
    // Allow admin routes (all routes starting with /admin)
    if (basePath.startsWith('/admin')) {
      return true;
    }
    
    if (allowList.includes(basePath) || allowList.includes(to.fullPath)) return true;
    
    // Also allow interactive-video with query parameters
    if (basePath === '/interactive-video') return true;

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

    // Don't redirect admin routes or allowlist routes to home
    const isAdminRoute = basePath.startsWith('/admin');
    const isAllowedRoute = allowList.includes(basePath) || allowList.includes(to.fullPath);
    
    if (!routesStates && to.fullPath !== "/home" && !isAdminRoute && !isAllowedRoute) {
      return "/home";
    }

    return true;
    });
  },
});
