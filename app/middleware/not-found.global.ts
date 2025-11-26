export default defineNuxtRouteMiddleware((to, from) => {
    // Check if the destination path exists in the router
    const nuxtApp = useNuxtApp();
    
    // Get all available routes
    const routes = nuxtApp.$router.getRoutes();
    
    // Check if the current route exists
    const routeExists = routes.some(route => {
      // For exact matches
      if (route.path === to.path) return true;
      
      // For dynamic routes
      if (route.path.includes(':') && new RegExp(route.path.replace(/:\w+/g, '[^/]+')).test(to.path)) return true;
      
      return false;
    });
    
    // If route doesn't exist and is not already the error page, redirect
    if (!routeExists && to.path !== '/error/page-not-found') {
      return navigateTo('/error/page-not-found');
    }
  });