import { isTokenExpiringSoon, refreshToken } from "~/utilities/jwToken";

export default defineNuxtRouteMiddleware((to, from) => {
    const token = useCookie("signInAccessToken");
    if (token.value && isTokenExpiringSoon(token.value, 300)) {
        
        const refreshedToken = refreshToken();
        if(refreshed !== null){
            token.value =  refreshedToken; // Call backend to refresh
        }
    }
});
