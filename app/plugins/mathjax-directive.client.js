// plugins/mathjax-directive.client.js
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.directive('mathjax', {
      mounted(el) {
        nextTick(() => {
          if (window.mathJaxLoaded && window.MathJaxRender) {
            window.mathJaxLoaded.then(() => {
              window.MathJaxRender([el]);
            });
          }
        });
      },
      updated(el) {
        if (window.mathJaxLoaded && window.MathJaxRender) {
          window.mathJaxLoaded.then(() => {
            window.MathJaxRender([el]);
          });
        }
      }
    });
    
    // Add global method to force rendering
    nuxtApp.provide('renderMath', (elements = null) => {
      if (window.mathJaxLoaded && window.MathJaxRender) {
        return window.mathJaxLoaded.then(() => {
          return window.MathJaxRender(elements);
        });
      }
      return Promise.resolve();
    });
  });