export default defineNuxtRouteMiddleware((to, from) => {
    const user = useCookie('userToken') // Example: Checking login token in cookies
    const path = useState('topicToView')

    if (!user.value && path.value && to.path !== '/auth' ) {
      return navigateTo('/auth') 
    }
});