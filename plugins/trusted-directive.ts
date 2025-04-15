// ~/plugins/trusted-directive.ts
import trusted from "@/directives/trusted";

export default defineNuxtPlugin((nuxtApp) => {  
    nuxtApp.vueApp.directive('trusted',trusted );
  });
  