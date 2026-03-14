import { useNavigationStore } from "~/stores/navigationStore";

const HOME_PATHS = new Set(["/", "/home"]);

export default defineNuxtRouteMiddleware((to, from) => {
  if (!from.path || !HOME_PATHS.has(from.path)) {
    return;
  }

  if (HOME_PATHS.has(to.path)) {
    return;
  }

  if (to.path === "/auth" || to.path.startsWith("/auth/")) {
    return;
  }

  useNavigationStore().resetRememberedRoutes();
});
