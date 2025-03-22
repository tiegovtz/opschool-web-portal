import { isTokenExpiringSoon, refreshToken } from "~/utilities/jwToken";

export default defineNuxtRouteMiddleware((to, from) => {
    const token = useCookie("signInAccessToken");
    const isAbout = isTokenExpiringSoon(token.value, 300)
    if (token.value && isAbout) {
        
        const refreshedToken = refreshToken();
        if(refreshed !== null){
            token.value =  refreshedToken; // Call backend to refresh
        }
    }
    else{
        token.value = null
    }
});
