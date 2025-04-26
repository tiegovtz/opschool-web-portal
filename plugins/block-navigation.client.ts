export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  const navigationStore = useNavigationStore()
  router.beforeEach((to, from) => {
    const user = useCookie("signInUserToken");

    // User must be logged in
    if (!user.value) return true; // allow navigation if not logged in
    
    // Check route state
    const routesStates = navigationStore.getLatestRoute()
    // If no page state and not navigating to /home, redirect to /home
    if(to.fullPath === '/profile') return true;
    else if(to.fullPath === '/feedback') return true;
    else if (!routesStates && to.fullPath !== '/home') {
      // return navigateTo('/home', { replace: true });

     return false;

    }
    // else if(routesStates &&  from.fullPath.includes(routesStates)){
    //   return navigateTo("/home");
    // }

    return true; // allow navigation
  });
});
