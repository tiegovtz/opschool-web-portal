export default defineNuxtRouteMiddleware((to) => {
  if (to.path === "/error/page-not-found") return;

  const router = useRouter();
  const resolvedRoute = router.resolve({
    path: to.path,
    query: to.query,
    hash: to.hash,
  });

  if (!resolvedRoute.matched.length) {
    return navigateTo("/error/page-not-found");
  }
});
