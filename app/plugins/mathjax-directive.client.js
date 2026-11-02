// plugins/mathjax-directive.client.js
import { nextTick } from "vue";

function mjStableKey(el, binding) {
  if (binding.value !== undefined && binding.value !== null) {
    return String(binding.value);
  }
  return "";
}

function shouldSkipTypeset(el, key) {
  if (!key) return false;
  if (el.getAttribute("data-mj-key") !== key) return false;
  return Boolean(el.querySelector("mjx-container, mjx-math, .MathJax"));
}

function runTypeset(el, binding) {
  const key = mjStableKey(el, binding);
  nextTick(() => {
    if (!window.mathJaxLoaded) return;
    window.mathJaxLoaded
      .then(async () => {
        await window.MathJax?.startup?.promise;
        if (typeof window.MathJaxRender !== "function") return false;
        await window.MathJaxRender([el]);
        return true;
      })
      .then((rendered) => {
        if (rendered && key) el.setAttribute("data-mj-key", key);
      })
      .catch(() => {
        /* avoid blocking UI if MathJax fails */
      });
  });
}

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.directive('mathjax', {
      mounted(el, binding) {
        runTypeset(el, binding);
      },
      updated(el, binding) {
        const key = mjStableKey(el, binding);
        if (key && shouldSkipTypeset(el, key)) {
          return;
        }
        runTypeset(el, binding);
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
