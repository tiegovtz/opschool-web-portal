import { isTokenExpiringSoon } from "~/utilities/jwToken";

export default defineNuxtRouteMiddleware((to, from) => {
    const user = useCookie('signInUserToken') // Example: Checking login token in cookies
    const path = useState('topicToView')

    

    if (!user.value && to.path !== '/auth' && isTokenExpiringSoon(user.value,300) ) {
       if(!path.value ){
        return navigateTo('/home')
       } 
      return navigateTo('/auth') 
    }
});