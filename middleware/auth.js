export default defineNuxtRouteMiddleware((to, from) => {
    const user = useCookie('userToken') // Example: Checking login token in cookies
    const path = useState('topicToView')

    if (!user.value && to.path !== '/auth' ) {
       if(!path.value ){
        return navigateTo('/home')
       } 
      return navigateTo('/auth') 
    }
});